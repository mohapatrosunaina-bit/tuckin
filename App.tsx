import { useEffect, useState, useCallback } from 'react';
import './App.css';
import { formatPaise } from './utils.js';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  deliveryZone: string;
  isOpen: boolean;
  cuisine: string;
  rating: number;
}

interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  pricePaise: number;
  available: boolean;
  category: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

interface Order {
  id: string;
  restaurantId: string;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  totalPaise: number;
  deliveryZone: string;
  estimatedDeliveryMinutes: number;
  createdAt: string;
}

interface DeliveryTracking {
  orderId: string;
  status: Order['status'];
  estimatedDeliveryMinutes: number;
  simulated: boolean;
  updatedAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'operator'>('customer');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cart & Active Order State
  const [cart, setCart] = useState<{ [itemId: string]: { item: MenuItem; quantity: number } }>({});
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryTracking | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Operator orders list
  const [operatorOrders, setOperatorOrders] = useState<Order[]>([]);

  const selectRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setMenuLoading(true);
    fetch(`/api/restaurants/${restaurant.id}/menu`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load menu`);
        return res.json();
      })
      .then((data) => {
        setMenuItems(data.items || []);
        setMenuLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load menu items', err);
        setMenuLoading(false);
      });
  }, []);

  const loadOperatorOrders = useCallback(() => {
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : { orders: [] }))
      .then((data) => setOperatorOrders(data.orders || []))
      .catch((err) => console.error('Failed to load operator orders', err));
  }, []);

  useEffect(() => {
    fetch('/api/restaurants')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load restaurants`);
        return res.json();
      })
      .then((data) => {
        const list: Restaurant[] = data.restaurants || [];
        setRestaurants(list);
        if (list.length > 0) {
          selectRestaurant(list[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load restaurants', err);
        setError('Could not connect to restaurant service. Please verify service status.');
        setLoading(false);
      });
  }, [selectRestaurant]);

  // Poll delivery status if active order is not yet delivered or cancelled
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'DELIVERED' || currentOrder.status === 'CANCELLED') {
      return;
    }

    const interval = setInterval(() => {
      fetch(`/api/delivery/${currentOrder.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: DeliveryTracking | null) => {
          if (data) {
            setDeliveryInfo(data);
            if (data.status !== currentOrder.status) {
              setCurrentOrder((prev) => (prev ? { ...prev, status: data.status } : null));
            }
          }
        })
        .catch((err) => console.error('Error polling delivery:', err));
    }, 4000);

    return () => clearInterval(interval);
  }, [currentOrder]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const current = prev[item.id]?.quantity || 0;
      return {
        ...prev,
        [item.id]: { item, quantity: current + 1 }
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const current = prev[itemId]?.quantity || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantity: current - 1 }
      };
    });
  };

  const placeOrder = async () => {
    if (!selectedRestaurant || Object.keys(cart).length === 0) return;
    setIsPlacingOrder(true);
    setError(null);

    const items = Object.values(cart).map(({ item, quantity }) => ({
      menuItemId: item.id,
      quantity
    }));

    try {
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          deliveryZone: selectedRestaurant.deliveryZone,
          items
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to place order');
      }

      const orderData: Order = await res.json();
      setCurrentOrder(orderData);
      setCart({});

      // Fetch initial delivery info
      const delivRes = await fetch(`/api/delivery/${orderData.id}`);
      if (delivRes.ok) {
        const delivData = await delivRes.json();
        setDeliveryInfo(delivData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while placing order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const advanceSimulation = async () => {
    if (!currentOrder) return;
    try {
      const res = await fetch(`/api/delivery/${currentOrder.id}/simulate-next`, {
        method: 'POST'
      });
      if (res.ok) {
        const updated: DeliveryTracking = await res.json();
        setDeliveryInfo(updated);
        setCurrentOrder((prev) => (prev ? { ...prev, status: updated.status } : null));

        // Sync with order-service status
        await fetch(`/api/orders/${currentOrder.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: updated.status })
        });
      }
    } catch (err) {
      console.error('Error advancing delivery simulation:', err);
    }
  };

  const updateOperatorOrderStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        // Sync with delivery service
        await fetch(`/api/delivery/${orderId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        loadOperatorOrders();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const cartTotalPaise = Object.values(cart).reduce(
    (sum, entry) => sum + entry.item.pricePaise * entry.quantity,
    0
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-logo">
          <span className="brand-icon">🍛</span>
          <div>
            <h1>Tuckin</h1>
            <p className="subtitle">Production DevOps & Cloud Microservices Platform</p>
          </div>
        </div>

        <nav className="tab-nav">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('customer')}
          >
            Customer View
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'operator' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('operator');
              loadOperatorOrders();
            }}
          >
            Restaurant Operator
          </button>
        </nav>

        <div className="delivery-badge">
          <span className="pulse-indicator"></span>
          <span>Zone: <strong>Central Hub (Live)</strong></span>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {activeTab === 'customer' ? (
        <main className="main-content">
          <section className="restaurants-section">
            <div className="section-title">
              <h2>Partner Kitchens</h2>
              <span className="count-pill">{restaurants.length} Open</span>
            </div>

            {loading ? (
              <div className="loading-state">Loading restaurants...</div>
            ) : (
              <div className="restaurant-grid">
                {restaurants.map((rest) => (
                  <article
                    key={rest.id}
                    className={`restaurant-card ${selectedRestaurant?.id === rest.id ? 'active' : ''}`}
                    onClick={() => selectRestaurant(rest)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedRestaurant?.id === rest.id}
                  >
                    <div className="card-top">
                      <h3>{rest.name}</h3>
                      <span className="rating-badge">★ {rest.rating}</span>
                    </div>
                    <p className="cuisine">{rest.cuisine}</p>
                    <p className="description">{rest.description}</p>
                    <div className="card-footer">
                      <span className="zone-tag">{rest.deliveryZone}</span>
                      <span className="status-tag open">{rest.isOpen ? 'Open Now' : 'Closed'}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="menu-section">
            {selectedRestaurant ? (
              <>
                <div className="menu-header">
                  <div>
                    <h2>{selectedRestaurant.name} — Menu</h2>
                    <p className="menu-subtitle">{selectedRestaurant.description}</p>
                  </div>
                </div>

                {menuLoading ? (
                  <div className="loading-state">Loading menu items...</div>
                ) : (
                  <div className="menu-grid">
                    {menuItems.map((item) => (
                      <article key={item.id} className="menu-item-card">
                        <div className="item-details">
                          <div className="item-header">
                            <span className="category-pill">{item.category}</span>
                            <h4>{item.name}</h4>
                          </div>
                          <p className="item-desc">{item.description}</p>
                          <div className="item-price">{formatPaise(item.pricePaise)}</div>
                        </div>
                        <div className="item-actions">
                          {cart[item.id] ? (
                            <div className="cart-counter">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="qty">{cart[item.id].quantity}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-add"
                              onClick={() => addToCart(item)}
                              disabled={!item.available}
                            >
                              {item.available ? 'Add +' : 'Sold Out'}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">Select a restaurant to view its fresh menu.</div>
            )}
          </section>

          <aside className="cart-sidebar">
            <div className="cart-header">
              <h3>Your Order</h3>
              <span className="cart-badge">{Object.values(cart).reduce((a, b) => a + b.quantity, 0)} items</span>
            </div>

            <div className="cart-items">
              {Object.keys(cart).length === 0 ? (
                <p className="empty-cart-text">Your basket is empty. Browse items to add.</p>
              ) : (
                Object.values(cart).map(({ item, quantity }) => (
                  <div key={item.id} className="cart-row">
                    <div className="cart-row-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-unit">{formatPaise(item.pricePaise)} × {quantity}</span>
                    </div>
                    <span className="cart-row-total">{formatPaise(item.pricePaise * quantity)}</span>
                  </div>
                ))
              )}
            </div>

            {Object.keys(cart).length > 0 && (
              <div className="cart-summary">
                <div className="summary-row total">
                  <span>Total (Server Calculated)</span>
                  <span>{formatPaise(cartTotalPaise)}</span>
                </div>
                <p className="calc-note">* Verified in integer paise by Order Service</p>
                <button
                  type="button"
                  className="btn-checkout"
                  onClick={placeOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? 'Validating Order...' : 'Place Order Now'}
                </button>
              </div>
            )}

            {currentOrder && (
              <div className="live-order-tracker">
                <div className="tracker-header">
                  <h4>Live Order Status</h4>
                  <span className={`status-pill ${currentOrder.status.toLowerCase()}`}>
                    {currentOrder.status}
                  </span>
                </div>
                <p className="order-id-tag">Order ID: <code>{currentOrder.id.substring(0, 8)}...</code></p>
                <div className="eta-block">
                  <span className="eta-label">Estimated Delivery ETA:</span>
                  <span className="eta-value">
                    {deliveryInfo ? `${deliveryInfo.estimatedDeliveryMinutes} mins` : `${currentOrder.estimatedDeliveryMinutes} mins`}
                  </span>
                </div>

                <div className="simulation-actions">
                  <button
                    type="button"
                    className="btn-sim-step"
                    onClick={advanceSimulation}
                    disabled={currentOrder.status === 'DELIVERED'}
                  >
                    Simulate Next Milestone ➔
                  </button>
                </div>
              </div>
            )}
          </aside>
        </main>
      ) : (
        <section className="operator-view">
          <div className="operator-header">
            <h2>Kitchen & Delivery Operator Console</h2>
            <button type="button" className="btn-refresh" onClick={loadOperatorOrders}>
              ↻ Refresh Orders
            </button>
          </div>

          <div className="operator-orders-list">
            {operatorOrders.length === 0 ? (
              <div className="empty-state">No orders in the pipeline currently. Place one from Customer View!</div>
            ) : (
              operatorOrders.map((order) => (
                <article key={order.id} className="operator-order-card">
                  <div className="order-card-meta">
                    <div>
                      <strong>Order #{order.id.substring(0, 8)}</strong>
                      <span className="time-tag">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                  </div>

                  <div className="order-items-summary">
                    {order.items.map((it, idx) => (
                      <span key={idx} className="item-bubble">
                        {it.name} × {it.quantity} ({formatPaise(it.lineTotalPaise)})
                      </span>
                    ))}
                  </div>

                  <div className="order-bottom-bar">
                    <span className="order-amount">Total: {formatPaise(order.totalPaise)}</span>

                    <div className="operator-actions">
                      {order.status === 'PLACED' && (
                        <button
                          type="button"
                          className="btn-action accept"
                          onClick={() => updateOperatorOrderStatus(order.id, 'ACCEPTED')}
                        >
                          Accept Order
                        </button>
                      )}
                      {order.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          className="btn-action prepare"
                          onClick={() => updateOperatorOrderStatus(order.id, 'PREPARING')}
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button
                          type="button"
                          className="btn-action pickup"
                          onClick={() => updateOperatorOrderStatus(order.id, 'PICKED_UP')}
                        >
                          Mark Picked Up
                        </button>
                      )}
                      {order.status === 'PICKED_UP' && (
                        <button
                          type="button"
                          className="btn-action out"
                          onClick={() => updateOperatorOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                        >
                          Out for Delivery
                        </button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          type="button"
                          className="btn-action deliver"
                          onClick={() => updateOperatorOrderStatus(order.id, 'DELIVERED')}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
