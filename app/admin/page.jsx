"use client";

import { useEffect, useState } from "react";
import "./dashboard.css";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard, ShoppingBag, Package, Users, ChartNoAxesCombined,
  Megaphone, Wallet, Warehouse, BadgePercent, Grid2X2, Mail,
  MessageCircle, FileText, Settings, CircleHelp, LogOut, Search,
  Moon, Bell, Maximize, ChevronRight, ChevronDown, ShoppingCart,
  CircleDollarSign, Crown, Zap, Menu, CreditCard, Plus, Trash2,
  Lock, CheckCircle2, CircleAlert, UploadCloud, Store, Type,
  Image as ImageIcon, X
} from "lucide-react";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Orders", icon: ShoppingBag, badge: "New" },
  { name: "Products", icon: Package, arrow: true },
  { name: "Customers", icon: Users, arrow: true },
  { name: "Analytics", icon: ChartNoAxesCombined, arrow: true },
  { name: "Marketing", icon: Megaphone, arrow: true },
  { name: "Finance", icon: Wallet, arrow: true },
  { name: "Inventory", icon: Warehouse, arrow: true },
  { name: "Discounts", icon: BadgePercent, arrow: true },
  { name: "Apps", icon: Grid2X2, arrow: true },
];

function PanelTitle({ icon: Icon, title, action = "", onAction }) {
  return (
    <div className="panel-title">
      <div className="panel-heading"><Icon size={19} /><span>{title}</span></div>
      {action ? <button className="text-button" onClick={onAction}>{action} <span>→</span></button> : null}
    </div>
  );
}

function Avatar({ index = 0, customUrl = "" }) {
  const images = [
    "photo-1500648767791-00dcc994a43e",
    "photo-1534528741775-53994a69daeb",
    "photo-1506794778202-cad84cf45f1d",
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1544005313-94ddf0286df2"
  ];
  return (
    <img
      className="avatar"
      src={customUrl || `https://images.unsplash.com/${images[index % images.length]}?auto=format&fit=crop&w=100&q=80`}
      alt=""
    />
  );
}

function parsePrice(price) {
  return parseFloat(String(price || "0").replace(/[^0-9.]/g, "")) || 0;
}

function getGreeting(lang = "English") {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return lang === "বাংলা" ? "শুভ সকাল," : "Good Morning,";
  } else if (hour >= 12 && hour < 17) {
    return lang === "বাংলা" ? "শুভ দুপুর," : "Good Afternoon,";
  } else if (hour >= 17 && hour < 21) {
    return lang === "বাংলা" ? "শুভ সন্ধ্যা," : "Good Evening,";
  } else {
    return lang === "বাংলা" ? "শুভ রাত্রি," : "Good Night,";
  }
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Topbar functional states
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("English");
  const [dimTheme, setDimTheme] = useState(false);

  // Customizable Admin Profile states
  const [adminName, setAdminName] = useState("Jisan Ahmed");
  const [adminAvatar, setAdminAvatar] = useState("");
  const [adminAvatarFile, setAdminAvatarFile] = useState(null);

  const [dbProducts, setDbProducts] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);

  const [storeSettings, setStoreSettings] = useState({
    store_name: "",
    hero_title: "",
    hero_subtitle: "",
    hero_image: ""
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedAdminName = localStorage.getItem("nexa_admin_name");
    const savedAdminAvatar = localStorage.getItem("nexa_admin_avatar");
    if (savedAdminName) setAdminName(savedAdminName);
    if (savedAdminAvatar) setAdminAvatar(savedAdminAvatar);

    const authStatus = localStorage.getItem("nexa_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      fetchData();
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem("nexa_admin_auth", "true");
      setIsAuthenticated(true);
      setLoginError("");
      fetchData();
    } else {
      setLoginError("ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nexa_admin_auth");
    setIsAuthenticated(false);
    setActiveTab("Dashboard");
    setIsMobileMenuOpen(false);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  async function fetchData() {
    setLoading(true);

    const { data: pData } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (pData) setDbProducts(pData);

    const { data: oData } = await supabase.from("orders").select("*").order("id", { ascending: false });
    if (oData) setDbOrders(oData);

    const { data: sData } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (sData) setStoreSettings(sData);

    setLoading(false);
  }

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return alert("দয়া করে নাম এবং দাম দিন!");
    setIsSubmitting(true);

    let finalImageUrl = "https://via.placeholder.com/200";
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("nexa-images").upload(fileName, imageFile);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("nexa-images").getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase.from("products").insert([
      { name: newName, price: newPrice.startsWith("$") ? newPrice : `$${newPrice}`, image_url: finalImageUrl, rating: 5 }
    ]);

    if (!error) {
      alert("✅ প্রোডাক্ট সফলভাবে অ্যাড হয়েছে!");
      setNewName("");
      setNewPrice("");
      setImageFile(null);
      if (document.getElementById("imageUploadInput")) document.getElementById("imageUploadInput").value = "";
      fetchData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this product?")) {
      await supabase.from("products").delete().eq("id", id);
      fetchData();
    }
  };

  const handleApplyDiscount = async (product, percent) => {
    const current = parsePrice(product.price);
    const discounted = (current - (current * percent) / 100).toFixed(2);
    await supabase.from("products").update({ price: `$${discounted}` }).eq("id", product.id);
    fetchData();
  };

  const handleCompleteOrder = async (id) => {
    await supabase.from("orders").update({ status: "Delivered" }).eq("id", id);
    fetchData();
  };

  const handleDeleteOrder = async (id) => {
    if (confirm("আপনি কি নিশ্চিত এই অর্ডারটি ডিলিট করতে চান?")) {
      await supabase.from("orders").delete().eq("id", id);
      fetchData();
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    let finalBannerUrl = storeSettings.hero_image;
    let finalAdminAvatarUrl = adminAvatar;

    if (bannerFile) {
      const fileExt = bannerFile.name.split(".").pop();
      const fileName = `banner_${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("nexa-images").upload(fileName, bannerFile);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("nexa-images").getPublicUrl(fileName);
        finalBannerUrl = publicUrlData.publicUrl;
      }
    }

    if (adminAvatarFile) {
      const fileExt = adminAvatarFile.name.split(".").pop();
      const fileName = `admin_${Math.random()}.${fileExt}`;
      const { error: avatarError } = await supabase.storage.from("nexa-images").upload(fileName, adminAvatarFile);
      if (!avatarError) {
        const { data: publicUrlData } = supabase.storage.from("nexa-images").getPublicUrl(fileName);
        finalAdminAvatarUrl = publicUrlData.publicUrl;
      }
    }

    // Save Admin Name & Photo
    localStorage.setItem("nexa_admin_name", adminName);
    if (finalAdminAvatarUrl) {
      localStorage.setItem("nexa_admin_avatar", finalAdminAvatarUrl);
      setAdminAvatar(finalAdminAvatarUrl);
    }

    const { error } = await supabase.from("store_settings").update({
      store_name: storeSettings.store_name,
      hero_title: storeSettings.hero_title,
      hero_subtitle: storeSettings.hero_subtitle,
      hero_image: finalBannerUrl
    }).eq("id", 1);

    if (!error) {
      alert("✅ ওয়েবসাইট এবং এডমিন প্রোফাইল সেটিংস সফলভাবে আপডেট হয়েছে!");
      setBannerFile(null);
      setAdminAvatarFile(null);
      if (document.getElementById("bannerUploadInput")) document.getElementById("bannerUploadInput").value = "";
      if (document.getElementById("adminAvatarInput")) document.getElementById("adminAvatarInput").value = "";
      fetchData();
    } else {
      alert("❌ এরর: " + error.message);
    }
    setIsSavingSettings(false);
  };

  const totalOrders = dbOrders.length;
  const uniqueCustomers = new Set(dbOrders.map((o) => o.customer_phone || o.customer_name)).size;
  const totalRevenue = dbOrders.reduce((sum, o) => sum + parsePrice(o.price), 0);
  const deliveredOrdersList = dbOrders.filter((o) => o.status === "Delivered");
  const pendingOrdersList = dbOrders.filter((o) => o.status !== "Delivered");
  const pendingOrders = pendingOrdersList.length;
  const deliveredRevenue = deliveredOrdersList.reduce((sum, o) => sum + parsePrice(o.price), 0);
  const pendingRevenue = pendingOrdersList.reduce((sum, o) => sum + parsePrice(o.price), 0);

  const stats = [
    { title: "Total Orders", value: String(totalOrders), color: "purple", icon: ShoppingCart },
    { title: "Total Customers", value: String(uniqueCustomers), color: "green", icon: Users },
    { title: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "blue", icon: CircleDollarSign },
    { title: "Pending Orders", value: String(pendingOrders), color: "orange", icon: Package },
  ];

  const customerMap = {};
  dbOrders.forEach((o) => {
    const key = o.customer_phone || o.customer_name || "Unknown";
    if (!customerMap[key]) {
      customerMap[key] = {
        name: o.customer_name || "Customer",
        phone: o.customer_phone || "",
        address: o.customer_address || "N/A",
        total: 0,
        orders: 0
      };
    }
    customerMap[key].total += parsePrice(o.price);
    customerMap[key].orders += 1;
  });
  const allCustomers = Object.values(customerMap).sort((a, b) => b.total - a.total);
  const customers = allCustomers.slice(0, 5);

  const activities = dbOrders.slice(0, 5).map((o) => ({
    title: o.status === "Delivered" ? "Order delivered" : "New order received",
    detail: `${o.product_name} · ${o.price}`,
    time: o.customer_name,
    color: o.status === "Delivered" ? "green" : "purple",
    icon: o.status === "Delivered" ? CheckCircle2 : ShoppingCart,
  }));

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredProducts = q ? dbProducts.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.price || "").toLowerCase().includes(q)) : dbProducts;
  const filteredOrders = q ? dbOrders.filter((o) => (o.customer_name || "").toLowerCase().includes(q) || (o.customer_phone || "").toLowerCase().includes(q) || (o.product_name || "").toLowerCase().includes(q)) : dbOrders;
  const filteredCustomers = q ? allCustomers.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.phone || "").toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q)) : allCustomers;

  if (isCheckingAuth) {
    return <div className="admin-shell" style={{ justifyContent: "center", alignItems: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-shell" style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ background: "#0b1b34", padding: "40px", borderRadius: "15px", border: "1px solid #172b48", width: "100%", maxWidth: "400px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "inline-flex", padding: "15px", background: "linear-gradient(135deg, #aa36ff, #382cff)", borderRadius: "12px", marginBottom: "20px" }}>
            <Lock size={32} color="white" />
          </div>
          <h2 style={{ fontSize: "24px", margin: "0 0 10px", color: "white" }}>Admin Login</h2>
          <p style={{ color: "#9db5d8", fontSize: "13px", marginBottom: "30px" }}>Authorized Access Only</p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              type="password"
              placeholder="Enter secure password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ padding: "12px 15px", borderRadius: "8px", border: "1px solid #1b3559", background: "#050f20", color: "white", fontSize: "14px", outline: "none" }}
              required
            />
            {loginError && <span style={{ color: "#ff4169", fontSize: "12px", textAlign: "left" }}>{loginError}</span>}
            <button type="submit" style={{ padding: "12px", borderRadius: "8px", background: "linear-gradient(105deg, #752cff, #285eff)", color: "white", fontWeight: "bold", cursor: "pointer", border: "none" }}>
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className="admin-shell" style={{ filter: dimTheme ? "hue-rotate(18deg) brightness(1.08)" : "none" }}>
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><ShoppingBag size={25} /></div>
          <div>
            <h1>{storeSettings?.store_name || "NexaPanel"}</h1>
            <p>E-commerce Admin</p>
          </div>
          <button className="icon-button mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="navigation">
          {menu.map(({ name, icon: Icon, badge, arrow }) => (
            <button
              key={name}
              onClick={() => { setActiveTab(name); setIsMobileMenuOpen(false); }}
              className={`nav-item ${activeTab === name ? "active" : ""}`}
            >
              <Icon size={20} /><span>{name}</span>
              {badge && <b className={badge === "New" ? "nav-badge blue-badge" : "nav-badge"}>{badge}</b>}
              {arrow && <ChevronRight className="nav-arrow" size={16} />}
            </button>
          ))}
          <div className="nav-separator" />
          <button
            className={`nav-item ${activeTab === "Email" ? "active" : ""}`}
            onClick={() => { setActiveTab("Email"); setIsMobileMenuOpen(false); }}
          >
            <Mail size={20} /><span>Email</span><b className="nav-badge">{dbOrders.length}</b>
          </button>
          <button
            className={`nav-item ${activeTab === "Chat" ? "active" : ""}`}
            onClick={() => { setActiveTab("Chat"); setIsMobileMenuOpen(false); }}
          >
            <MessageCircle size={20} /><span>Chat</span><b className="nav-badge blue-badge">{pendingOrders}</b>
          </button>
          <button
            className={`nav-item ${activeTab === "Reports" ? "active" : ""}`}
            onClick={() => { setActiveTab("Reports"); setIsMobileMenuOpen(false); }}
          >
            <FileText size={20} /><span>Reports</span><ChevronRight className="nav-arrow" size={16} />
          </button>
          <div className="nav-separator" />
          <button
            className={`nav-item ${activeTab === "Settings" ? "active" : ""}`}
            onClick={() => { setActiveTab("Settings"); setIsMobileMenuOpen(false); }}
          >
            <Settings size={20} /><span>Settings</span><ChevronRight className="nav-arrow" size={16} />
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${activeTab === "Help Center" ? "active" : ""}`}
            onClick={() => { setActiveTab("Help Center"); setIsMobileMenuOpen(false); }}
          >
            <CircleHelp size={20} /><span>Help Center</span>
          </button>
          <button className="nav-item" onClick={handleLogout} style={{ color: "#ff4169" }}>
            <LogOut size={20} /><span>Logout</span>
          </button>
        </div>

        <div className="profile" onClick={() => setActiveTab("Settings")} style={{ cursor: "pointer" }} title="Click to change Admin Name & Photo">
          <Avatar customUrl={adminAvatar} />
          <div className="profile-info"><strong>{adminName || "Store Admin"}</strong><span>Admin</span></div>
          <ChevronDown size={16} />
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={21} />
          </button>
          <label className="search-box">
            <Search size={19} />
            <input
              placeholder="Search products, orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} style={{ background: "transparent", border: "none", color: "#ff4169" }}>✕</button>
            ) : (
              <kbd>⌘ K</kbd>
            )}
          </label>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setDimTheme(!dimTheme)} title="Toggle Theme Contrast">
              <Moon size={21} />
            </button>
            <button className="icon-button" onClick={toggleFullScreen} title="Toggle Fullscreen">
              <Maximize size={19} />
            </button>
            <button className="icon-button notification" onClick={() => setActiveTab("Orders")} title="View Pending Orders">
              <Bell size={21} /><b>{pendingOrders}</b>
            </button>
            <button className="language" onClick={() => setLanguage(language === "English" ? "বাংলা" : "English")}>
              🇧🇩 <span>{language}</span><ChevronDown size={15} />
            </button>
            <div className="top-profile" onClick={() => setActiveTab("Settings")} style={{ cursor: "pointer" }} title="Click to edit Admin Name & Photo">
              <Avatar customUrl={adminAvatar} /><div><strong>{adminName || "Store Admin"}</strong><span>Admin</span></div><ChevronDown size={15} />
            </div>
          </div>
        </header>

        {/* Global Search Results Banner when typing on Dashboard */}
        {q && activeTab === "Dashboard" && (
          <div style={{ padding: "15px 17px 0" }}>
            <section className="panel" style={{ border: "1px solid #752cff" }}>
              <PanelTitle icon={Search} title={`Search Results for "${searchQuery}"`} action="Clear" onAction={() => setSearchQuery("")} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "15px" }}>
                <div>
                  <strong style={{ color: "#a28aff", display: "block", marginBottom: "8px" }}>Matching Orders ({filteredOrders.length})</strong>
                  {filteredOrders.slice(0, 4).map((o) => (
                    <div key={o.id} onClick={() => setActiveTab("Orders")} style={{ padding: "6px 0", borderBottom: "1px solid #142944", cursor: "pointer" }}>
                      #{o.id} - <b>{o.customer_name}</b> ({o.product_name})
                    </div>
                  ))}
                </div>
                <div>
                  <strong style={{ color: "#00e5a7", display: "block", marginBottom: "8px" }}>Matching Products ({filteredProducts.length})</strong>
                  {filteredProducts.slice(0, 4).map((p) => (
                    <div key={p.id} onClick={() => setActiveTab("Products")} style={{ padding: "6px 0", borderBottom: "1px solid #142944", cursor: "pointer" }}>
                      <b>{p.name}</b> — {p.price}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "Dashboard" && (
          <div className="dashboard-content">
            <div className="left-column">
              <section className="welcome-banner">
                <div className="welcome-copy">
                  <h2>{getGreeting(language)} <span>{adminName || "Store Admin"}</span> 👋</h2>
                  <p>{language === "বাংলা" ? "আজ আপনার স্টোরের সর্বশেষ আপডেট নিচে দেখুন।" : "Here's what's happening with your store today."}</p>
                </div>
                <div className="banner-art">
                  <ShoppingBag className="banner-bag" size={76} />
                </div>
              </section>

              <section className="stats-grid">
                {stats.map(({ title, value, color, icon: Icon }) => (
                  <article className="stat-card" key={title}>
                    <div className="stat-top">
                      <div className={`stat-icon ${color}`}><Icon size={24} /></div>
                      <div className="stat-label"><span>{title}</span><strong>{value}</strong></div>
                    </div>
                  </article>
                ))}
              </section>

              <div className="bottom-grid">
                <section className="panel customers-panel">
                  <PanelTitle icon={Crown} title="Top Customers" action="View all" onAction={() => setActiveTab("Customers")} />
                  {loading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading...</div>
                  ) : customers.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No customers yet. Orders will show here.</div>
                  ) : (
                    customers.map((c, index) => (
                      <div className="customer-row" key={c.phone || c.name}>
                        <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                        <Avatar index={index} />
                        <div className="customer-info"><strong>{c.name}</strong><span>{c.phone}</span></div>
                        <div className="customer-total"><strong>${c.total.toFixed(2)}</strong><span>{c.orders} orders</span></div>
                      </div>
                    ))
                  )}
                </section>
              </div>
            </div>

            <aside className="right-column">
              <section className="panel activity-panel">
                <PanelTitle icon={Zap} title="Recent Activities" action="Orders" onAction={() => setActiveTab("Orders")} />
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading...</div>
                ) : activities.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No activity yet.</div>
                ) : (
                  activities.map(({ title, detail, time, color, icon: Icon }, index) => (
                    <div className="activity-row" key={`${title}-${index}`}>
                      <div className={`activity-icon ${color}`}><Icon size={20} /></div>
                      <div className="activity-info"><strong>{title}</strong><span>{detail}</span></div>
                      <time>{time}</time>
                    </div>
                  ))
                )}
              </section>
            </aside>
          </div>
        )}

        {activeTab === "Products" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel" style={{ padding: "25px" }}>
              <PanelTitle icon={Package} title="Add New Product to Live Store" action="" />
              <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "15px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <div className="search-box" style={{ flex: 1, maxWidth: "100%" }}>
                  <Package size={18} />
                  <input type="text" placeholder="Product Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <div className="search-box" style={{ flex: 1, maxWidth: "100%" }}>
                  <CircleDollarSign size={18} />
                  <input type="text" placeholder="Price (e.g. 99.00)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
                </div>
                <div className="search-box" style={{ flex: 1, maxWidth: "100%", cursor: "pointer", position: "relative" }}>
                  <UploadCloud size={18} />
                  <span style={{ color: "#8fa6ca", fontSize: "12px", marginLeft: "5px" }}>
                    {imageFile ? imageFile.name : "Choose an Image from PC..."}
                  </span>
                  <input id="imageUploadInput" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer" }} />
                </div>
                <button type="submit" disabled={isSubmitting} style={{ background: "linear-gradient(105deg, #752cff, #285eff)", color: "white", padding: "0 25px", borderRadius: "8px", fontWeight: "600", border: "none", cursor: "pointer", height: "41px" }}>
                  {isSubmitting ? "Uploading..." : "Save Product"}
                </button>
              </form>
            </section>

            <section className="panel products-panel">
              <PanelTitle icon={ShoppingCart} title={`Manage Live Products (${filteredProducts.length})`} action="" />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "30px minmax(0, 1.5fr) 1fr 1fr 50px" }}>
                  <span>#</span><span>Product</span><span>Price</span><span>Status</span><span>Delete</span>
                </div>
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading...</div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <div className="table-row" key={product.id} style={{ gridTemplateColumns: "30px minmax(0, 1.5fr) 1fr 1fr 50px" }}>
                      <span>{index + 1}</span>
                      <span className="product-name">
                        <i style={{ overflow: "hidden" }}>
                          <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </i>
                        {product.name}
                      </span>
                      <span>{product.price}</span>
                      <span><b className="stock">In Stock</b></span>
                      <button onClick={() => handleDelete(product.id)} style={{ background: "transparent", border: "none", color: "#ff3c67", cursor: "pointer" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Orders" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel products-panel">
              <PanelTitle icon={ShoppingBag} title={`Live Customer Orders (${filteredOrders.length})`} action="" />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 100px 50px" }}>
                  <span>ID</span><span>Customer Details</span><span>Phone</span><span>Product</span><span>Price</span><span>Status</span><span>Delete</span>
                </div>
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No orders yet.</div>
                ) : (
                  filteredOrders.map((order) => (
                    <div className="table-row" key={order.id} style={{ gridTemplateColumns: "40px 1.5fr 1fr 1fr 1fr 100px 50px", alignItems: "center" }}>
                      <span>#{order.id}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <strong style={{ fontSize: "12px", color: "white" }}>{order.customer_name}</strong>
                        <span style={{ fontSize: "10px", color: "#8fa6ca" }}>{order.customer_address}</span>
                      </div>
                      <span>{order.customer_phone}</span>
                      <span style={{ color: "#d8c6ff" }}>{order.product_name}</span>
                      <span style={{ color: "#00e5a7", fontWeight: "bold" }}>{order.price}</span>
                      {order.status === "Delivered" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#006b59", color: "#a6ffe7", padding: "4px 8px", borderRadius: "6px", fontSize: "9px", fontWeight: "bold" }}>
                          <CheckCircle2 size={12} /> Delivered
                        </span>
                      ) : (
                        <button onClick={() => handleCompleteOrder(order.id)} style={{ background: "#8b4b00", color: "#ffe0a0", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>
                          Mark Deliver
                        </button>
                      )}
                      <button onClick={() => handleDeleteOrder(order.id)} style={{ background: "transparent", border: "none", color: "#ff3c67", cursor: "pointer" }} title="Delete Order">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Customers" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel products-panel">
              <PanelTitle icon={Users} title={`All Store Customers (${filteredCustomers.length})`} action="" />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "40px 1.5fr 1fr 1.5fr 100px 100px" }}>
                  <span>#</span><span>Customer Name</span><span>Phone Number</span><span>Address</span><span>Total Orders</span><span>Total Spent</span>
                </div>
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No customers found yet.</div>
                ) : (
                  filteredCustomers.map((c, index) => (
                    <div className="table-row" key={c.phone || c.name} style={{ gridTemplateColumns: "40px 1.5fr 1fr 1.5fr 100px 100px", alignItems: "center", minHeight: "48px" }}>
                      <span>{index + 1}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Avatar index={index} />
                        <strong style={{ fontSize: "12px", color: "white" }}>{c.name}</strong>
                      </div>
                      <span>{c.phone}</span>
                      <span style={{ color: "#8fa6ca" }}>{c.address}</span>
                      <span><b className="stock">{c.orders} Orders</b></span>
                      <span style={{ color: "#00e5a7", fontWeight: "bold", fontSize: "12px" }}>${c.total.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Analytics" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                  <div className="stat-label">
                    <span>Delivery Success Rate</span>
                    <strong>{totalOrders ? Math.round((deliveredOrdersList.length / totalOrders) * 100) : 0}%</strong>
                  </div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue"><CircleDollarSign size={24} /></div>
                  <div className="stat-label">
                    <span>Average Order Value</span>
                    <strong>${totalOrders ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}</strong>
                  </div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple"><Package size={24} /></div>
                  <div className="stat-label">
                    <span>Total Live Products</span>
                    <strong>{dbProducts.length}</strong>
                  </div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange"><Users size={24} /></div>
                  <div className="stat-label">
                    <span>Repeat Customers</span>
                    <strong>{allCustomers.filter((c) => c.orders > 1).length}</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="panel">
              <PanelTitle icon={ChartNoAxesCombined} title="Store Performance Breakdown" action="" />
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "10px 0" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Delivered Orders ({deliveredOrdersList.length})</span>
                    <strong style={{ color: "#00e5a7" }}>${deliveredRevenue.toFixed(2)}</strong>
                  </div>
                  <div style={{ height: "10px", background: "#0b1b34", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${totalOrders ? (deliveredOrdersList.length / totalOrders) * 100 : 0}%`, height: "100%", background: "#00d7a0" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Pending Orders ({pendingOrders})</span>
                    <strong style={{ color: "#ffb22f" }}>${pendingRevenue.toFixed(2)}</strong>
                  </div>
                  <div style={{ height: "10px", background: "#0b1b34", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${totalOrders ? (pendingOrders / totalOrders) * 100 : 0}%`, height: "100%", background: "#ffb22f" }} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "Marketing" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel" style={{ padding: "25px" }}>
              <PanelTitle icon={Megaphone} title="Marketing & Store Promotion" action="Edit Banner" onAction={() => setActiveTab("Settings")} />
              <p style={{ color: "#9db5d8", marginBottom: "20px" }}>Share your live store link on Facebook, WhatsApp, or Instagram to get more orders.</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <div className="search-box" style={{ maxWidth: "450px", flex: 1 }}>
                  <Store size={18} />
                  <input readOnly value={typeof window !== "undefined" ? window.location.origin : "https://your-store.vercel.app"} />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    alert("✅ স্টোরের লিংক কপি হয়েছে! এখন যেকোনো জায়গায় শেয়ার করুন।");
                  }}
                  style={{ background: "linear-gradient(105deg, #752cff, #285eff)", color: "white", padding: "0 20px", height: "41px", borderRadius: "8px", border: "none", fontWeight: "bold" }}
                >
                  Copy Store Link
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "Finance" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue"><Wallet size={24} /></div>
                  <div className="stat-label"><span>Total Gross Revenue</span><strong>${totalRevenue.toFixed(2)}</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                  <div className="stat-label"><span>Delivered (Earned)</span><strong>${deliveredRevenue.toFixed(2)}</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange"><CreditCard size={24} /></div>
                  <div className="stat-label"><span>Pending Collection</span><strong>${pendingRevenue.toFixed(2)}</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple"><ShoppingBag size={24} /></div>
                  <div className="stat-label"><span>Total Transactions</span><strong>{totalOrders}</strong></div>
                </div>
              </article>
            </section>

            <section className="panel products-panel">
              <PanelTitle icon={Wallet} title="Recent Financial Transactions" action="" />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "60px 1.5fr 1.5fr 1fr 1fr" }}>
                  <span>Order</span><span>Customer</span><span>Item Sold</span><span>Amount</span><span>Payment Status</span>
                </div>
                {dbOrders.map((o) => (
                  <div className="table-row" key={o.id} style={{ gridTemplateColumns: "60px 1.5fr 1.5fr 1fr 1fr" }}>
                    <span>#{o.id}</span>
                    <strong>{o.customer_name}</strong>
                    <span>{o.product_name}</span>
                    <strong style={{ color: "#00e5a7" }}>{o.price}</strong>
                    <span>
                      <b className={`stock ${o.status === "Delivered" ? "" : "low"}`}>
                        {o.status === "Delivered" ? "Cleared" : "Pending COD"}
                      </b>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Inventory" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel products-panel">
              <PanelTitle icon={Warehouse} title={`Warehouse Inventory (${dbProducts.length} Items)`} action="Add Product" onAction={() => setActiveTab("Products")} />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "50px 2fr 1fr 1fr 1fr" }}>
                  <span>ID</span><span>Product Name</span><span>Unit Price</span><span>Rating</span><span>Inventory Status</span>
                </div>
                {dbProducts.map((p) => (
                  <div className="table-row" key={p.id} style={{ gridTemplateColumns: "50px 2fr 1fr 1fr 1fr" }}>
                    <span>#{p.id}</span>
                    <span className="product-name">
                      <i style={{ overflow: "hidden" }}>
                        <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </i>
                      {p.name}
                    </span>
                    <strong style={{ color: "#00e5a7" }}>{p.price}</strong>
                    <span>⭐ {p.rating || 5}.0</span>
                    <span><b className="stock">Available in Stock</b></span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Discounts" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel products-panel">
              <PanelTitle icon={BadgePercent} title="Quick Product Discount Manager" action="" />
              <p style={{ color: "#9db5d8", marginBottom: "15px" }}>Click a discount button below to immediately reduce the live price of any product.</p>
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "40px 2fr 1fr 180px" }}>
                  <span>#</span><span>Product</span><span>Current Price</span><span>Apply Instant Discount</span>
                </div>
                {dbProducts.map((p, i) => (
                  <div className="table-row" key={p.id} style={{ gridTemplateColumns: "40px 2fr 1fr 180px" }}>
                    <span>{i + 1}</span>
                    <strong>{p.name}</strong>
                    <strong style={{ color: "#00e5a7" }}>{p.price}</strong>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleApplyDiscount(p, 10)} style={{ background: "#315cff", color: "white", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold" }}>
                        -10% OFF
                      </button>
                      <button onClick={() => handleApplyDiscount(p, 20)} style={{ background: "#752cff", color: "white", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold" }}>
                        -20% OFF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Apps" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                  <div className="stat-label"><span>Supabase Database</span><strong>Connected</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon purple"><UploadCloud size={24} /></div>
                  <div className="stat-label"><span>Image Storage Bucket</span><strong>nexa-images</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon blue"><Lock size={24} /></div>
                  <div className="stat-label"><span>Admin Security</span><strong>Active</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange"><Zap size={24} /></div>
                  <div className="stat-label"><span>Real-time Sync</span><strong>Online</strong></div>
                </div>
              </article>
            </section>
          </div>
        )}

        {activeTab === "Email" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel">
              <PanelTitle icon={Mail} title={`Order Notification Inbox (${dbOrders.length})`} action="" />
              {dbOrders.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No order notifications yet.</div>
              ) : (
                dbOrders.map((o) => (
                  <div className="activity-row" key={o.id}>
                    <div className="activity-icon blue"><Mail size={18} /></div>
                    <div className="activity-info">
                      <strong>Order #{o.id} — {o.customer_name} ({o.customer_phone})</strong>
                      <span>Ordered: {o.product_name} · Price: {o.price} · Address: {o.customer_address}</span>
                    </div>
                    <span className="stock">{o.status || "Pending"}</span>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {activeTab === "Chat" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel">
              <PanelTitle icon={MessageCircle} title="Direct Customer Contact (Call / WhatsApp)" action="" />
              {allCustomers.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No customer contacts yet.</div>
              ) : (
                allCustomers.map((c, idx) => (
                  <div className="customer-row" key={c.phone || idx} style={{ padding: "8px 0" }}>
                    <Avatar index={idx} />
                    <div className="customer-info">
                      <strong>{c.name}</strong>
                      <span>Phone: {c.phone} · Address: {c.address}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href={`tel:${c.phone}`}
                        style={{ background: "#1684ff", color: "white", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold", fontSize: "11px" }}
                      >
                        📞 Call
                      </a>
                      <a
                        href={`https://wa.me/88${String(c.phone).replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background: "#00a884", color: "white", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold", fontSize: "11px" }}
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {activeTab === "Reports" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel" style={{ padding: "25px" }}>
              <PanelTitle icon={FileText} title="Store Summary Report" action="Print Report" onAction={() => window.print()} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #142944" }}>
                  <span>Store Name:</span><strong>{storeSettings.store_name || "NexaPanel"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #142944" }}>
                  <span>Admin Name:</span><strong>{adminName || "Store Admin"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #142944" }}>
                  <span>Total Products Listed:</span><strong>{dbProducts.length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #142944" }}>
                  <span>Total Orders Received:</span><strong>{totalOrders}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #142944" }}>
                  <span>Completed / Delivered Orders:</span><strong style={{ color: "#00e5a7" }}>{deliveredOrdersList.length}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #142944" }}>
                  <span>Pending Orders:</span><strong style={{ color: "#ffb22f" }}>{pendingOrders}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "5px", fontSize: "16px" }}>
                  <span>Total Revenue Generated:</span><strong style={{ color: "#00e5a7" }}>${totalRevenue.toFixed(2)}</strong>
                </div>
              </div>
              <button
                onClick={() => window.print()}
                style={{ marginTop: "20px", background: "linear-gradient(105deg, #752cff, #285eff)", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "bold" }}
              >
                🖨️ Print / Save PDF Report
              </button>
            </section>
          </div>
        )}

        {activeTab === "Help Center" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel" style={{ padding: "25px", lineHeight: "1.7" }}>
              <PanelTitle icon={CircleHelp} title="Admin Panel Guide & Help Center" action="" />
              <ul style={{ color: "#c0d1f6", paddingLeft: "18px" }}>
                <li><strong>Products:</strong> নতুন প্রোডাক্টের নাম, দাম এবং ছবি দিয়ে Save করলেই মেইন ওয়েবসাইটে লাইভ হয়ে যাবে।</li>
                <li><strong>Orders:</strong> কাস্টমার অর্ডার করলে এখানে আসবে। ডেলিভারি হয়ে গেলে <b>Mark Deliver</b> বাটনে ক্লিক করবেন, আর ফেক অর্ডার হলে ডিলিট (🗑️) করে দেবেন।</li>
                <li><strong>Discounts:</strong> যেকোনো প্রোডাক্টে এক ক্লিকে ১০% বা ২০% ছাড় দিতে পারবেন।</li>
                <li><strong>Chat:</strong> কাস্টমারকে সরাসরি কল বা WhatsApp-এ মেসেজ পাঠাতে পারবেন।</li>
                <li><strong>Settings:</strong> এডমিনের নিজের নাম, ছবি এবং ওয়েবসাইটের নাম, ব্যানার ও টাইটেল পরিবর্তন করতে পারবেন।</li>
              </ul>
            </section>
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="panel" style={{ padding: "25px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
              <PanelTitle icon={Settings} title="Admin Profile & Store Customization" action="" />
              <p style={{ color: "#9db5d8", fontSize: "12px", marginBottom: "20px" }}>Change Admin Name, Admin Profile Photo, Store Name, and Homepage Banner here.</p>

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ color: "#b4c7e7", fontSize: "11px", marginBottom: "8px", display: "block" }}>Admin Name (Your Name)</label>
                  <div className="search-box" style={{ maxWidth: "100%" }}>
                    <Users size={18} />
                    <input
                      type="text"
                      placeholder="Enter Admin Name"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ color: "#b4c7e7", fontSize: "11px", marginBottom: "8px", display: "block" }}>Admin Profile Picture</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar customUrl={adminAvatar} />
                    <div className="search-box" style={{ maxWidth: "100%", flex: 1, cursor: "pointer", position: "relative" }}>
                      <UploadCloud size={18} />
                      <span style={{ color: "#8fa6ca", fontSize: "12px", marginLeft: "5px" }}>
                        {adminAvatarFile ? adminAvatarFile.name : "Upload new admin photo from PC..."}
                      </span>
                      <input
                        id="adminAvatarInput"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAdminAvatarFile(e.target.files[0])}
                        style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="nav-separator" style={{ margin: "5px 0" }} />

                <div>
                  <label style={{ color: "#b4c7e7", fontSize: "11px", marginBottom: "8px", display: "block" }}>Store Name</label>
                  <div className="search-box" style={{ maxWidth: "100%" }}>
                    <Store size={18} />
                    <input type="text" value={storeSettings.store_name} onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label style={{ color: "#b4c7e7", fontSize: "11px", marginBottom: "8px", display: "block" }}>Homepage Main Title</label>
                  <div className="search-box" style={{ maxWidth: "100%" }}>
                    <Type size={18} />
                    <input type="text" value={storeSettings.hero_title} onChange={(e) => setStoreSettings({ ...storeSettings, hero_title: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label style={{ color: "#b4c7e7", fontSize: "11px", marginBottom: "8px", display: "block" }}>Homepage Subtitle</label>
                  <div className="search-box" style={{ maxWidth: "100%" }}>
                    <Type size={18} />
                    <input type="text" value={storeSettings.hero_subtitle} onChange={(e) => setStoreSettings({ ...storeSettings, hero_subtitle: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label style={{ color: "#b4c7e7", fontSize: "11px", marginBottom: "8px", display: "block" }}>Homepage Banner Image</label>
                  <div className="search-box" style={{ maxWidth: "100%", cursor: "pointer", position: "relative" }}>
                    <ImageIcon size={18} />
                    <span style={{ color: "#8fa6ca", fontSize: "12px", marginLeft: "5px" }}>
                      {bannerFile ? bannerFile.name : "Upload new banner from PC..."}
                    </span>
                    <input id="bannerUploadInput" type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer" }} />
                  </div>
                  {storeSettings.hero_image && !bannerFile && (
                    <img src={storeSettings.hero_image} alt="Current Banner" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px", marginTop: "10px", opacity: 0.5 }} />
                  )}
                </div>

                <button type="submit" disabled={isSavingSettings} style={{ background: "linear-gradient(105deg, #00cfa6, #007f7a)", color: "white", padding: "12px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", marginTop: "10px" }}>
                  {isSavingSettings ? "Saving Settings..." : "Save Live Settings"}
                </button>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}