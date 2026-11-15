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
  Image as ImageIcon, X, Pencil, Tag, RefreshCw
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

// 🇧🇩 যেকোনো প্রাইসকে বাংলাদেশী টাকায় (৳) ফরম্যাট করার ফাংশন
function formatBDT(price) {
  const num = parsePrice(price);
  return `৳${num.toLocaleString("en-IN")}`;
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

// প্রোডাক্টের ছবি, Real Price, Discount Price, Stock Status এবং Offer বের করার হেল্পার ফাংশন
function parseProductData(product) {
  const rawUrl = String(product?.image_url || "");
  let meta = { realPrice: "", discountPrice: "", stock: "In Stock", offer: "" };
  let cleanUrlForGallery = rawUrl;

  if (rawUrl.includes("#meta=")) {
    const [beforeMeta, afterMeta] = rawUrl.split("#meta=");
    const [metaEncoded, galleryPart] = afterMeta.split("#gallery=");
    try {
      meta = { ...meta, ...JSON.parse(decodeURIComponent(metaEncoded)) };
    } catch (e) {
      // ignore parse error
    }
    cleanUrlForGallery = galleryPart ? `${beforeMeta}#gallery=${galleryPart}` : beforeMeta;
  }

  const [mainUrl, galleryHash] = cleanUrlForGallery.split("#gallery=");
  const extras = galleryHash ? galleryHash.split("|").filter(Boolean) : [];
  const images = [mainUrl, ...extras].filter(Boolean);

  const dbPriceNum = parsePrice(product?.price);
  const realPriceNum = meta.realPrice ? parsePrice(meta.realPrice) : dbPriceNum;
  const discountPriceNum = meta.discountPrice ? parsePrice(meta.discountPrice) : 0;
  const sellingPriceNum = discountPriceNum > 0 ? discountPriceNum : realPriceNum;

  return {
    images,
    realPrice: realPriceNum,
    discountPrice: discountPriceNum,
    sellingPrice: sellingPriceNum,
    stock: meta.stock || "In Stock",
    offer: meta.offer || ""
  };
}

// ডাটাবেসে কোনোরকম কলাম এরর ছাড়াই ছবি + Real Price + Discount Price + Stock + Offer সেভ করার হেল্পার
function buildProductImageUrl(urlsArray, metaObj) {
  const validUrls = (urlsArray || []).filter(Boolean);
  const mainUrl = validUrls[0] || "https://via.placeholder.com/200";
  const extraUrls = validUrls.slice(1);

  const metaString = encodeURIComponent(
    JSON.stringify({
      realPrice: metaObj.realPrice ? String(parsePrice(metaObj.realPrice)) : "",
      discountPrice: metaObj.discountPrice ? String(parsePrice(metaObj.discountPrice)) : "",
      stock: metaObj.stock || "In Stock",
      offer: metaObj.offer || ""
    })
  );

  let finalUrl = `${mainUrl}#meta=${metaString}`;
  if (extraUrls.length > 0) {
    finalUrl += `#gallery=${extraUrls.join("|")}`;
  }
  return finalUrl;
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

  // 🎁 Global Offer Banner Control State (Admin Panel থেকে কন্ট্রোল করার জন্য)
  const [globalOfferText, setGlobalOfferText] = useState("");
  const [globalOfferActive, setGlobalOfferActive] = useState(true);

  const [loading, setLoading] = useState(true);

  // 🖼️ প্রোডাক্ট আপলোড এবং এডিট করার স্টেটসমূহ
  const [editingProductId, setEditingProductId] = useState(null);
  const [newName, setNewName] = useState("");
  const [newRealPrice, setNewRealPrice] = useState("");
  const [newDiscountPrice, setNewDiscountPrice] = useState("");
  const [newStockStatus, setNewStockStatus] = useState("In Stock");
  const [newOfferTag, setNewOfferTag] = useState("");
  const [existingImageUrls, setExistingImageUrls] = useState([null, null, null, null]);
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discounts ট্যাবে ম্যানুয়ালি ডিসকাউন্ট প্রাইস এডিট করার স্টেট
  const [customDiscountInputs, setCustomDiscountInputs] = useState({});

  useEffect(() => {
    const savedAdminName = localStorage.getItem("nexa_admin_name");
    const savedAdminAvatar = localStorage.getItem("nexa_admin_avatar");
    const savedGlobalOffer = localStorage.getItem("nexa_global_offer");
    const savedGlobalOfferActive = localStorage.getItem("nexa_global_offer_active");

    if (savedAdminName) setAdminName(savedAdminName);
    if (savedAdminAvatar) setAdminAvatar(savedAdminAvatar);
    if (savedGlobalOffer) setGlobalOfferText(savedGlobalOffer);
    if (savedGlobalOfferActive !== null) setGlobalOfferActive(savedGlobalOfferActive === "true");

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

  // 📸 ৪টি বক্সে ছবি সিলেক্ট করার ফাংশন
  const handleSelectProductImages = (slotIndex, fileList) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    setImageFiles((prev) => {
      const updated = [...prev];
      if (filesArray.length > 1) {
        filesArray.slice(0, 4).forEach((file, idx) => {
          if (slotIndex + idx < 4) {
            updated[slotIndex + idx] = file;
          }
        });
      } else {
        updated[slotIndex] = filesArray[0];
      }
      return updated;
    });
  };

  const removeSelectedImage = (slotIndex) => {
    setImageFiles((prev) => {
      const updated = [...prev];
      updated[slotIndex] = null;
      return updated;
    });
    setExistingImageUrls((prev) => {
      const updated = [...prev];
      updated[slotIndex] = null;
      return updated;
    });
    const inputEl = document.getElementById(`imageUploadInput_${slotIndex}`);
    if (inputEl) inputEl.value = "";
  };

  // ✏️ প্রোডাক্ট এডিট মোডে ওপেন করার ফাংশন
  const handleStartEditProduct = (product) => {
    const parsed = parseProductData(product);
    setEditingProductId(product.id);
    setNewName(product.name || "");
    setNewRealPrice(parsed.realPrice ? String(parsed.realPrice) : "");
    setNewDiscountPrice(parsed.discountPrice ? String(parsed.discountPrice) : "");
    setNewStockStatus(parsed.stock || "In Stock");
    setNewOfferTag(parsed.offer || "");

    const slots = [null, null, null, null];
    parsed.images.slice(0, 4).forEach((url, idx) => {
      slots[idx] = url;
    });
    setExistingImageUrls(slots);
    setImageFiles([null, null, null, null]);

    setActiveTab("Products");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewName("");
    setNewRealPrice("");
    setNewDiscountPrice("");
    setNewStockStatus("In Stock");
    setNewOfferTag("");
    setExistingImageUrls([null, null, null, null]);
    setImageFiles([null, null, null, null]);
    [0, 1, 2, 3].forEach((idx) => {
      const el = document.getElementById(`imageUploadInput_${idx}`);
      if (el) el.value = "";
    });
  };

  // 🚀 প্রোডাক্ট অ্যাড অথবা আপডেট (Save / Edit) করার ফাংশন
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!newName || !newRealPrice) return alert("দয়া করে প্রোডাক্টের নাম এবং আসল দাম (Real Price) দিন!");
    setIsSubmitting(true);

    const finalSlotUrls = [];

    for (let i = 0; i < 4; i++) {
      const file = imageFiles[i];
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `prod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("nexa-images").upload(fileName, file);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("nexa-images").getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            finalSlotUrls.push(publicUrlData.publicUrl);
          }
        }
      } else if (existingImageUrls[i]) {
        finalSlotUrls.push(existingImageUrls[i]);
      }
    }

    const realNum = parsePrice(newRealPrice);
    const discNum = parsePrice(newDiscountPrice);
    const activeSellingPrice = discNum > 0 ? discNum : realNum;

    const finalImageUrl = buildProductImageUrl(finalSlotUrls, {
      realPrice: realNum,
      discountPrice: discNum > 0 ? discNum : "",
      stock: newStockStatus,
      offer: newOfferTag
    });

    const payload = {
      name: newName,
      price: `৳${activeSellingPrice}`,
      image_url: finalImageUrl,
      rating: 5
    };

    let error = null;
    if (editingProductId) {
      const res = await supabase.from("products").update(payload).eq("id", editingProductId);
      error = res.error;
    } else {
      const res = await supabase.from("products").insert([payload]);
      error = res.error;
    }

    if (!error) {
      alert(editingProductId ? "✅ প্রোডাক্ট সফলভাবে এডিট ও আপডেট হয়েছে!" : "✅ নতুন প্রোডাক্ট সফলভাবে অ্যাড হয়েছে!");
      resetProductForm();
      fetchData();
    } else {
      alert("❌ প্রোডাক্ট সেভ করতে সমস্যা হয়েছে: " + error.message);
    }
    setIsSubmitting(false);
  };

  // 🔄 এক ক্লিকে In Stock / Out of Stock পরিবর্তন করার ফাংশন
  const handleToggleStock = async (product) => {
    const parsed = parseProductData(product);
    const nextStock = parsed.stock === "Out of Stock" ? "In Stock" : "Out of Stock";

    const updatedImageUrl = buildProductImageUrl(parsed.images, {
      realPrice: parsed.realPrice,
      discountPrice: parsed.discountPrice > 0 ? parsed.discountPrice : "",
      stock: nextStock,
      offer: parsed.offer
    });

    const { error } = await supabase
      .from("products")
      .update({ image_url: updatedImageUrl })
      .eq("id", product.id);

    if (!error) {
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("আপনি কি নিশ্চিত এই প্রোডাক্টটি ডিলিট করতে চান?")) {
      if (editingProductId === id) resetProductForm();
      await supabase.from("products").delete().eq("id", id);
      fetchData();
    }
  };

  // 🏷️ পার্সেন্টেজ অনুযায়ী বা সরাসরি ডিসকাউন্ট প্রাইস সেট করার ফাংশন
  const handleApplyDiscount = async (product, percent) => {
    const parsed = parseProductData(product);
    const baseReal = parsed.realPrice || parsePrice(product.price);

    if (percent === 0) {
      // Reset to Real Price
      const updatedImageUrl = buildProductImageUrl(parsed.images, {
        realPrice: baseReal,
        discountPrice: "",
        stock: parsed.stock,
        offer: ""
      });
      await supabase.from("products").update({ price: `৳${baseReal}`, image_url: updatedImageUrl }).eq("id", product.id);
    } else {
      const discounted = Math.round(baseReal - (baseReal * percent) / 100);
      const updatedImageUrl = buildProductImageUrl(parsed.images, {
        realPrice: baseReal,
        discountPrice: discounted,
        stock: parsed.stock,
        offer: `${percent}% OFF`
      });
      await supabase.from("products").update({ price: `৳${discounted}`, image_url: updatedImageUrl }).eq("id", product.id);
    }
    fetchData();
  };

  const handleSetCustomDiscountPrice = async (product) => {
    const customVal = customDiscountInputs[product.id];
    if (!customVal) return alert("দয়া করে ডিসকাউন্ট দাম লিখুন!");
    const discNum = parsePrice(customVal);
    const parsed = parseProductData(product);
    const baseReal = parsed.realPrice || parsePrice(product.price);

    const percentOff = baseReal > discNum ? Math.round(((baseReal - discNum) / baseReal) * 100) : 0;

    const updatedImageUrl = buildProductImageUrl(parsed.images, {
      realPrice: baseReal,
      discountPrice: discNum,
      stock: parsed.stock,
      offer: percentOff > 0 ? `${percentOff}% OFF` : parsed.offer
    });

    await supabase.from("products").update({ price: `৳${discNum}`, image_url: updatedImageUrl }).eq("id", product.id);
    alert(`✅ ${product.name}-এর ডিসকাউন্ট দাম ৳${discNum} সেট করা হয়েছে!`);
    fetchData();
  };

  const handleSaveGlobalOffer = async (e) => {
    e.preventDefault();
    localStorage.setItem("nexa_global_offer", globalOfferText);
    localStorage.setItem("nexa_global_offer_active", String(globalOfferActive));

    // অপশনালি স্টোরের সাবটাইটেলেও অফার আপডেট করে দেওয়া যাবে যদি চায়
    if (globalOfferActive && globalOfferText) {
      await supabase.from("store_settings").update({
        hero_subtitle: globalOfferText
      }).eq("id", 1);
      fetchData();
    }
    alert("✅ স্পেশাল ডিসকাউন্ট অফার সফলভাবে সেভ ও লাইভ করা হয়েছে!");
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
    { title: "Total Revenue (BDT)", value: formatBDT(totalRevenue), color: "blue", icon: CircleDollarSign },
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
    detail: `${o.product_name} · ${formatBDT(o.price)}`,
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
                      #{o.id} - <b>{o.customer_name}</b> ({o.product_name}) — {formatBDT(o.price)}
                    </div>
                  ))}
                </div>
                <div>
                  <strong style={{ color: "#00e5a7", display: "block", marginBottom: "8px" }}>Matching Products ({filteredProducts.length})</strong>
                  {filteredProducts.slice(0, 4).map((p) => {
                    const parsed = parseProductData(p);
                    return (
                      <div key={p.id} onClick={() => setActiveTab("Products")} style={{ padding: "6px 0", borderBottom: "1px solid #142944", cursor: "pointer" }}>
                        <b>{p.name}</b> — {formatBDT(parsed.sellingPrice)} ({parsed.stock})
                      </div>
                    );
                  })}
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
                  {globalOfferActive && globalOfferText && (
                    <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255, 178, 47, 0.15)", border: "1px solid #ffb22f", color: "#ffd88a", padding: "5px 12px", borderRadius: "20px", fontSize: "12px" }}>
                      <BadgePercent size={15} /> <span>Active Offer: <b>{globalOfferText}</b></span>
                    </div>
                  )}
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
                        <div className="customer-total"><strong>{formatBDT(c.total)}</strong><span>{c.orders} orders</span></div>
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
            <section className="panel" style={{ padding: "25px", border: editingProductId ? "1px solid #00e5a7" : undefined }}>
              <PanelTitle
                icon={editingProductId ? Pencil : Package}
                title={editingProductId ? `Edit Product (#${editingProductId})` : "Add New Product (Up to 4 Photos)"}
                action={editingProductId ? "Cancel Edit" : ""}
                onAction={editingProductId ? resetProductForm : undefined}
              />

              <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "18px" }}>
                {/* নাম, আসল দাম (Real Price) এবং ডিসকাউন্ট দাম (Discount Price) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <div>
                    <label style={{ color: "#9db5d8", fontSize: "11px", display: "block", marginBottom: "6px" }}>Product Name *</label>
                    <div className="search-box" style={{ maxWidth: "100%" }}>
                      <Package size={18} />
                      <input
                        type="text"
                        placeholder="e.g. iPhone 15 Pro Max"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "#9db5d8", fontSize: "11px", display: "block", marginBottom: "6px" }}>Real Price / আসল দাম (৳) *</label>
                    <div className="search-box" style={{ maxWidth: "100%" }}>
                      <span style={{ color: "#00e5a7", fontWeight: "bold", fontSize: "15px" }}>৳</span>
                      <input
                        type="number"
                        placeholder="যেমন: 1500"
                        value={newRealPrice}
                        onChange={(e) => setNewRealPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "#9db5d8", fontSize: "11px", display: "block", marginBottom: "6px" }}>Discount Price / ডিসকাউন্ট দাম (৳)</label>
                    <div className="search-box" style={{ maxWidth: "100%", border: newDiscountPrice ? "1px solid #a28aff" : undefined }}>
                      <span style={{ color: "#a28aff", fontWeight: "bold", fontSize: "15px" }}>৳</span>
                      <input
                        type="number"
                        placeholder="ছাড়ের দাম (যেমন: 1200)"
                        value={newDiscountPrice}
                        onChange={(e) => setNewDiscountPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* স্টক স্ট্যাটাস (In Stock / Out of Stock) এবং স্পেশাল অফার ট্যাগ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <div>
                    <label style={{ color: "#9db5d8", fontSize: "11px", display: "block", marginBottom: "6px" }}>Stock Status (স্টক স্ট্যাটাস)</label>
                    <div className="search-box" style={{ maxWidth: "100%" }}>
                      <Warehouse size={18} color={newStockStatus === "Out of Stock" ? "#ff3c67" : "#00e5a7"} />
                      <select
                        value={newStockStatus}
                        onChange={(e) => setNewStockStatus(e.target.value)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: newStockStatus === "Out of Stock" ? "#ff3c67" : "#00e5a7",
                          fontWeight: "bold",
                          width: "100%",
                          outline: "none",
                          cursor: "pointer"
                        }}
                      >
                        <option value="In Stock" style={{ background: "#0b1b34", color: "#00e5a7" }}>✅ In Stock (স্টকে আছে)</option>
                        <option value="Out of Stock" style={{ background: "#0b1b34", color: "#ff3c67" }}>❌ Out of Stock (স্টক শেষ)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "#9db5d8", fontSize: "11px", display: "block", marginBottom: "6px" }}>Special Offer Badge / ডিসকাউন্ট অফার লেখা (Optional)</label>
                    <div className="search-box" style={{ maxWidth: "100%" }}>
                      <Tag size={18} color="#ffb22f" />
                      <input
                        type="text"
                        placeholder="যেমন: 20% OFF / ঈদ অফার / ফ্রি ডেলিভারি"
                        value={newOfferTag}
                        onChange={(e) => setNewOfferTag(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* ৪টি ছবি আপলোড করার গ্যালারি বক্স */}
                <div>
                  <label style={{ color: "#9db5d8", fontSize: "12px", display: "block", marginBottom: "8px" }}>
                    📸 প্রোডাক্টের ১-৪টি ছবি সিলেক্ট করুন (চাইলে একসাথে ৪টি ছবি সিলেক্ট করতে পারবেন অথবা আলাদা আলাদা বক্সে দিতে পারবেন):
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const currentFile = imageFiles[slotIdx];
                      const existingUrl = existingImageUrls[slotIdx];
                      const previewUrl = currentFile ? URL.createObjectURL(currentFile) : existingUrl;

                      return (
                        <div
                          key={slotIdx}
                          className="search-box"
                          style={{
                            maxWidth: "100%",
                            height: "52px",
                            cursor: "pointer",
                            position: "relative",
                            border: previewUrl ? "1px solid #00e5a7" : "1px dashed #2b4c7e",
                            background: previewUrl ? "rgba(0, 229, 167, 0.08)" : "#071426",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0 12px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt=""
                                style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                              />
                            ) : (
                              <UploadCloud size={18} color={slotIdx === 0 ? "#a28aff" : "#8fa6ca"} />
                            )}
                            <span style={{ color: previewUrl ? "#00e5a7" : "#8fa6ca", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {currentFile
                                ? currentFile.name
                                : existingUrl
                                ? `Saved Photo ${slotIdx + 1}`
                                : slotIdx === 0
                                ? "Photo 1 (Main) *"
                                : `Photo ${slotIdx + 1} (Optional)`}
                            </span>
                          </div>

                          {previewUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSelectedImage(slotIdx);
                              }}
                              style={{
                                position: "relative",
                                zIndex: 5,
                                background: "rgba(255,60,103,0.2)",
                                border: "none",
                                color: "#ff3c67",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: "bold"
                              }}
                              title="Remove photo"
                            >
                              ✕
                            </button>
                          )}

                          <input
                            id={`imageUploadInput_${slotIdx}`}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleSelectProductImages(slotIdx, e.target.files)}
                            style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer", zIndex: 2 }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: editingProductId
                        ? "linear-gradient(105deg, #00cfa6, #007f7a)"
                        : "linear-gradient(105deg, #752cff, #285eff)",
                      color: "white",
                      padding: "0 30px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      border: "none",
                      cursor: "pointer",
                      height: "42px"
                    }}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingProductId
                      ? "✅ Update Product"
                      : "🚀 Save New Product"}
                  </button>

                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      style={{
                        background: "#1b3559",
                        color: "white",
                        padding: "0 20px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer",
                        height: "42px"
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="panel products-panel">
              <PanelTitle icon={ShoppingCart} title={`Manage Live Products (${filteredProducts.length})`} action="" />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "35px minmax(0, 1.8fr) 1.2fr 1fr 1fr 90px" }}>
                  <span>#</span>
                  <span>Product & Photos</span>
                  <span>Real & Discount Price</span>
                  <span>Offer Badge</span>
                  <span>Stock (Click to change)</span>
                  <span>Edit / Del</span>
                </div>
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading...</div>
                ) : (
                  filteredProducts.map((product, index) => {
                    const parsed = parseProductData(product);
                    const isOut = parsed.stock === "Out of Stock";

                    return (
                      <div
                        className="table-row"
                        key={product.id}
                        style={{
                          gridTemplateColumns: "35px minmax(0, 1.8fr) 1.2fr 1fr 1fr 90px",
                          background: editingProductId === product.id ? "rgba(0, 229, 167, 0.08)" : undefined
                        }}
                      >
                        <span>{index + 1}</span>
                        <span className="product-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                            {parsed.images.slice(0, 4).map((url, idx) => (
                              <i key={idx} style={{ overflow: "hidden", width: "28px", height: "28px", borderRadius: "6px", display: "inline-block" }}>
                                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </i>
                            ))}
                          </div>
                          <span>
                            {product.name} <small style={{ color: "#a28aff" }}>({parsed.images.length} pic)</small>
                          </span>
                        </span>

                        {/* Real Price & Discount Price Display */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {parsed.discountPrice > 0 ? (
                            <>
                              <strong style={{ color: "#00e5a7", fontSize: "13px" }}>
                                {formatBDT(parsed.discountPrice)} <small style={{ color: "#a28aff", fontSize: "10px" }}>(Discount)</small>
                              </strong>
                              <span style={{ color: "#8fa6ca", textDecoration: "line-through", fontSize: "11px" }}>
                                Real: {formatBDT(parsed.realPrice)}
                              </span>
                            </>
                          ) : (
                            <strong style={{ color: "#00e5a7", fontSize: "13px" }}>
                              {formatBDT(parsed.realPrice)}
                            </strong>
                          )}
                        </div>

                        {/* Offer Badge */}
                        <span>
                          {parsed.offer ? (
                            <b style={{ background: "rgba(255, 178, 47, 0.18)", color: "#ffc456", padding: "3px 8px", borderRadius: "6px", fontSize: "10px" }}>
                              🔥 {parsed.offer}
                            </b>
                          ) : (
                            <span style={{ color: "#657d9e", fontSize: "11px" }}>No Offer</span>
                          )}
                        </span>

                        {/* In Stock / Out of Stock Button */}
                        <span>
                          <button
                            type="button"
                            onClick={() => handleToggleStock(product)}
                            title="ক্লিক করে In Stock / Out of Stock পরিবর্তন করুন"
                            style={{
                              background: isOut ? "rgba(255, 60, 103, 0.2)" : "rgba(0, 229, 167, 0.16)",
                              color: isOut ? "#ff4d79" : "#00e5a7",
                              border: isOut ? "1px solid #ff3c67" : "1px solid #00cfa6",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              cursor: "pointer"
                            }}
                          >
                            {isOut ? "❌ Out of Stock" : "✅ In Stock"}
                          </button>
                        </span>

                        {/* Edit & Delete Buttons */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditProduct(product)}
                            style={{
                              background: "rgba(117, 44, 255, 0.2)",
                              border: "1px solid #752cff",
                              color: "#bfa6ff",
                              borderRadius: "6px",
                              padding: "5px 8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            title="Edit Product"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            style={{
                              background: "rgba(255, 60, 103, 0.15)",
                              border: "none",
                              color: "#ff3c67",
                              borderRadius: "6px",
                              padding: "5px 8px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
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
                  <span>ID</span><span>Customer Details</span><span>Phone</span><span>Product</span><span>Price (BDT)</span><span>Status</span><span>Delete</span>
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
                      <span style={{ color: "#00e5a7", fontWeight: "bold" }}>{formatBDT(order.price)}</span>
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
                <div className="table-row table-head" style={{ gridTemplateColumns: "40px 1.5fr 1fr 1.5fr 100px 110px" }}>
                  <span>#</span><span>Customer Name</span><span>Phone Number</span><span>Address</span><span>Total Orders</span><span>Total Spent (৳)</span>
                </div>
                {loading ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#9db5d8" }}>No customers found yet.</div>
                ) : (
                  filteredCustomers.map((c, index) => (
                    <div className="table-row" key={c.phone || c.name} style={{ gridTemplateColumns: "40px 1.5fr 1fr 1.5fr 100px 110px", alignItems: "center", minHeight: "48px" }}>
                      <span>{index + 1}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Avatar index={index} />
                        <strong style={{ fontSize: "12px", color: "white" }}>{c.name}</strong>
                      </div>
                      <span>{c.phone}</span>
                      <span style={{ color: "#8fa6ca" }}>{c.address}</span>
                      <span><b className="stock">{c.orders} Orders</b></span>
                      <span style={{ color: "#00e5a7", fontWeight: "bold", fontSize: "12px" }}>{formatBDT(c.total)}</span>
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
                    <strong>{totalOrders ? formatBDT(Math.round(totalRevenue / totalOrders)) : "৳0"}</strong>
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
              <PanelTitle icon={ChartNoAxesCombined} title="Store Performance Breakdown (BDT)" action="" />
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "10px 0" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Delivered Orders ({deliveredOrdersList.length})</span>
                    <strong style={{ color: "#00e5a7" }}>{formatBDT(deliveredRevenue)}</strong>
                  </div>
                  <div style={{ height: "10px", background: "#0b1b34", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${totalOrders ? (deliveredOrdersList.length / totalOrders) * 100 : 0}%`, height: "100%", background: "#00d7a0" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span>Pending Orders ({pendingOrders})</span>
                    <strong style={{ color: "#ffb22f" }}>{formatBDT(pendingRevenue)}</strong>
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
                  <div className="stat-label"><span>Total Gross Revenue</span><strong>{formatBDT(totalRevenue)}</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                  <div className="stat-label"><span>Delivered (Earned)</span><strong>{formatBDT(deliveredRevenue)}</strong></div>
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-top">
                  <div className="stat-icon orange"><CreditCard size={24} /></div>
                  <div className="stat-label"><span>Pending Collection</span><strong>{formatBDT(pendingRevenue)}</strong></div>
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
              <PanelTitle icon={Wallet} title="Recent Financial Transactions (BDT)" action="" />
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "60px 1.5fr 1.5fr 1fr 1fr" }}>
                  <span>Order</span><span>Customer</span><span>Item Sold</span><span>Amount (৳)</span><span>Payment Status</span>
                </div>
                {dbOrders.map((o) => (
                  <div className="table-row" key={o.id} style={{ gridTemplateColumns: "60px 1.5fr 1.5fr 1fr 1fr" }}>
                    <span>#{o.id}</span>
                    <strong>{o.customer_name}</strong>
                    <span>{o.product_name}</span>
                    <strong style={{ color: "#00e5a7" }}>{formatBDT(o.price)}</strong>
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
                <div className="table-row table-head" style={{ gridTemplateColumns: "50px 1.8fr 1.2fr 1fr 1.2fr 80px" }}>
                  <span>ID</span><span>Product Name</span><span>Price (Real / Disc)</span><span>Offer</span><span>Stock Status (Click)</span><span>Edit</span>
                </div>
                {dbProducts.map((p) => {
                  const parsed = parseProductData(p);
                  const isOut = parsed.stock === "Out of Stock";
                  return (
                    <div className="table-row" key={p.id} style={{ gridTemplateColumns: "50px 1.8fr 1.2fr 1fr 1.2fr 80px" }}>
                      <span>#{p.id}</span>
                      <span className="product-name">
                        <i style={{ overflow: "hidden" }}>
                          <img src={parsed.images[0] || p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </i>
                        {p.name}
                      </span>
                      <div>
                        <strong style={{ color: "#00e5a7" }}>{formatBDT(parsed.sellingPrice)}</strong>
                        {parsed.discountPrice > 0 && (
                          <span style={{ color: "#8fa6ca", textDecoration: "line-through", fontSize: "10px", marginLeft: "6px" }}>
                            {formatBDT(parsed.realPrice)}
                          </span>
                        )}
                      </div>
                      <span>{parsed.offer || "—"}</span>
                      <span>
                        <button
                          onClick={() => handleToggleStock(p)}
                          style={{
                            background: isOut ? "rgba(255, 60, 103, 0.2)" : "rgba(0, 229, 167, 0.16)",
                            color: isOut ? "#ff4d79" : "#00e5a7",
                            border: isOut ? "1px solid #ff3c67" : "1px solid #00cfa6",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          {isOut ? "❌ Out of Stock" : "✅ Available in Stock"}
                        </button>
                      </span>
                      <button
                        onClick={() => handleStartEditProduct(p)}
                        style={{
                          background: "rgba(117, 44, 255, 0.2)",
                          border: "1px solid #752cff",
                          color: "#bfa6ff",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Discounts" && (
          <div className="dashboard-content" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* 🎁 Global Store Offer Banner Controller */}
            <section className="panel" style={{ padding: "25px" }}>
              <PanelTitle icon={Megaphone} title="Store Special Discount Offer Controller" action="" />
              <p style={{ color: "#9db5d8", fontSize: "12px", marginBottom: "15px" }}>
                এখান থেকে আপনার ওয়েবসাইটের স্পেশাল ডিসকাউন্ট অফার বা ক্যাম্পেইন মেসেজ কন্ট্রোল করতে পারবেন।
              </p>
              <form onSubmit={handleSaveGlobalOffer} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <div className="search-box" style={{ flex: 1, minWidth: "250px", maxWidth: "100%" }}>
                  <BadgePercent size={18} color="#ffb22f" />
                  <input
                    type="text"
                    placeholder="যেমন: 🔥 ধামাকা অফার! সব প্রোডাক্টে ৩০% পর্যন্ত ছাড় + ফ্রি ডেলিভারি!"
                    value={globalOfferText}
                    onChange={(e) => setGlobalOfferText(e.target.value)}
                  />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", color: "#00e5a7", fontSize: "12px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={globalOfferActive}
                    onChange={(e) => setGlobalOfferActive(e.target.checked)}
                  />
                  Offer Active
                </label>
                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(105deg, #00cfa6, #007f7a)",
                    color: "white",
                    padding: "0 20px",
                    height: "41px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  Save Offer Campaign
                </button>
              </form>
            </section>

            {/* Individual Product Real Price & Discount Price Controller */}
            <section className="panel products-panel">
              <PanelTitle icon={BadgePercent} title="Product Real Price & Discount Manager (BDT)" action="" />
              <p style={{ color: "#9db5d8", marginBottom: "15px", fontSize: "12px" }}>
                যেকোনো প্রোডাক্টের ডিসকাউন্ট দাম সরাসরি লিখে সেট করুন অথবা পাশের বাটনে ক্লিক করে ১০%, ২০% ছাড় দিন বা আসল দামে ফিরিয়ে নিন।
              </p>
              <div className="product-table">
                <div className="table-row table-head" style={{ gridTemplateColumns: "35px 1.6fr 1fr 1fr 1.4fr 190px" }}>
                  <span>#</span>
                  <span>Product</span>
                  <span>Real Price (৳)</span>
                  <span>Discount Price (৳)</span>
                  <span>Set Custom Discount Price</span>
                  <span>Quick Offer Actions</span>
                </div>
                {dbProducts.map((p, i) => {
                  const parsed = parseProductData(p);
                  return (
                    <div className="table-row" key={p.id} style={{ gridTemplateColumns: "35px 1.6fr 1fr 1fr 1.4fr 190px" }}>
                      <span>{i + 1}</span>
                      <strong>
                        {p.name}{" "}
                        {parsed.stock === "Out of Stock" && (
                          <small style={{ color: "#ff3c67" }}>(Out of Stock)</small>
                        )}
                      </strong>
                      <span style={{ color: "#9db5d8" }}>{formatBDT(parsed.realPrice)}</span>
                      <strong style={{ color: "#00e5a7" }}>
                        {parsed.discountPrice > 0 ? formatBDT(parsed.discountPrice) : "No Discount"}
                      </strong>

                      {/* Custom Discount Price Input */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <input
                          type="number"
                          placeholder="নতুন ছাড়ের দাম ৳"
                          value={customDiscountInputs[p.id] || ""}
                          onChange={(e) =>
                            setCustomDiscountInputs({ ...customDiscountInputs, [p.id]: e.target.value })
                          }
                          style={{
                            background: "#071426",
                            border: "1px solid #234069",
                            color: "white",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            width: "110px",
                            fontSize: "11px"
                          }}
                        />
                        <button
                          onClick={() => handleSetCustomDiscountPrice(p)}
                          style={{
                            background: "#00b388",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Set ৳
                        </button>
                      </div>

                      {/* Quick Discount Buttons */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleApplyDiscount(p, 10)}
                          style={{ background: "#315cff", color: "white", border: "none", padding: "5px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          -10%
                        </button>
                        <button
                          onClick={() => handleApplyDiscount(p, 20)}
                          style={{ background: "#752cff", color: "white", border: "none", padding: "5px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          -20%
                        </button>
                        <button
                          onClick={() => handleApplyDiscount(p, 0)}
                          title="Reset to Real Price"
                          style={{ background: "#23395b", color: "#ffd37a", border: "none", padding: "5px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                      <span>Ordered: {o.product_name} · Price: {formatBDT(o.price)} · Address: {o.customer_address}</span>
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
              <PanelTitle icon={FileText} title="Store Summary Report (BDT)" action="Print Report" onAction={() => window.print()} />
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
                  <span>Total Revenue Generated (BDT):</span><strong style={{ color: "#00e5a7" }}>{formatBDT(totalRevenue)}</strong>
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
                <li><strong>Products (Add & Edit):</strong> নতুন প্রোডাক্টের নাম, আসল দাম (Real Price), ডিসকাউন্ট দাম (Discount Price), স্টক স্ট্যাটাস (In Stock / Out of Stock) এবং ১-৪টি ছবি দিয়ে সেভ করতে পারবেন। আর যেকোনো প্রোডাক্টের পাশের <b>Edit (✏️)</b> বাটনে ক্লিক করে আবার এডিট করতে পারবেন।</li>
                <li><strong>Out of Stock:</strong> প্রোডাক্টের স্টক শেষ হয়ে গেলে লিস্টে থাকা <b>In Stock</b> বাটনে এক ক্লিক করলেই সেটি <b>Out of Stock</b> হয়ে যাবে।</li>
                <li><strong>Orders:</strong> কাস্টমার অর্ডার করলে এখানে বাংলাদেশী টাকায় (৳) দেখাবে। ডেলিভারি হয়ে গেলে <b>Mark Deliver</b> বাটনে ক্লিক করবেন।</li>
                <li><strong>Discounts:</strong> পুরো স্টোরের অফার ক্যাম্পেইন এবং যেকোনো প্রোডাক্টের ডিসকাউন্ট দাম এখান থেকে কন্ট্রোল করতে পারবেন।</li>
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