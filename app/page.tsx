"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Zap, Menu, ChevronRight, ChevronLeft,
  Star, MessageCircle, X, CheckCircle2, ArrowRight,
  Shirt, Smartphone, Home as HomeIcon, Heart, 
  Trophy, Gamepad2, ShoppingBag, LayoutGrid,
  Gift, Crown, Truck, Trash2, Flame, Copy, Check, ShieldCheck,
  Phone, Mail, MapPin, Headphones, ChevronUp, Send, Share2, Store, Award, RotateCcw,
  Globe as Facebook, Camera as Instagram, Play as Youtube, Music as Music2
} from 'lucide-react';
import { supabase } from './lib/supabase';

export default function NexaStore() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [settings, setSettings] = useState({ 
    store_name: 'NEXA',
    hero_image: ''
  });
  const [loading, setLoading] = useState(true);

  // 🔍 দারাজের মতো প্রোডাক্ট ডিটেইলস পেজ, ৪টি ছবির গ্যালারি এবং ইমেজ জুম স্টেট
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [detailQty, setDetailQty] = useState<number>(1);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState<boolean>(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  
  // Checkout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ☎️ ছবির মতো Customer Care Popup State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 💸 আপনার বিকাশ ও নগদ নাম্বার (আগের মতোই আছে, কিছু বদলাইনি)
  const MERCHANT_NUMBER = "01935133944";

  // ☎️ হেল্পলাইন / কাস্টমার কেয়ার — এখান থেকে সব জায়গায় নাম্বার যাবে
  const HELPLINE_NUMBER = "01935133944";
  const WHATSAPP_NUMBER = "8801935133944"; // শুরুর 0 বাদ দিয়ে সামনে 880
  const MESSENGER_LINK = "https://m.me/nexa"; // আপনার Facebook Page username বসান
  const STORE_EMAIL = "support@nexa.com.bd"; // আপনার ইমেইল বসান
  const STORE_ADDRESS = "ঢাকা, বাংলাদেশ"; // আপনার ঠিকানা বসান
  const whatsappUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent("হ্যালো " + settings.store_name + ", আমার সাহায্য প্রয়োজন।");

  const copyNumber = () => {
    navigator.clipboard.writeText(MERCHANT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // প্রোডাক্টের বিস্তারিত পেজ ওপেন করার ফাংশন (Daraz Style)
  const openProductDetails = (product: any) => {
    setViewingProduct(product);
    setDetailQty(1);
    setActiveImageIdx(0);
    setIsImageZoomOpen(false);
    setIsWishlisted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🧠 ১. SMART AUTO-BRAND DETECTOR (প্রোডাক্টের নাম দেখে অটোমেটিক আসল ব্র্যান্ড বের করবে)
  const getProductBrand = (product: any): string => {
    if (!product) return 'No Brand';

    if (product.brand && product.brand.trim() !== '') {
      return product.brand.trim();
    }

    const title = (product.name || '').toLowerCase();
    const compactTitle = title.replace(/[\s-_]/g, '');

    const brandRules: { keywords: string[]; brandName: string }[] = [
      { keywords: ['iphone', 'ipad', 'macbook', 'airpod', 'apple', 'imac', 'iwatch'], brandName: 'Apple' },
      { keywords: ['samsung', 'galaxy'], brandName: 'Samsung' },
      { keywords: ['xiaomi', 'redmi', 'poco', 'miband'], brandName: 'Xiaomi' },
      { keywords: ['realme', 'narzo'], brandName: 'Realme' },
      { keywords: ['vivo', 'iqoo'], brandName: 'Vivo' },
      { keywords: ['oppo', 'reno'], brandName: 'Oppo' },
      { keywords: ['oneplus', 'nord'], brandName: 'OnePlus' },
      { keywords: ['googlepixel', 'pixel'], brandName: 'Google' },
      { keywords: ['infinix'], brandName: 'Infinix' },
      { keywords: ['tecno', 'camon', 'spark'], brandName: 'Tecno' },
      { keywords: ['itel'], brandName: 'Itel' },
      { keywords: ['motorola', 'moto'], brandName: 'Motorola' },
      { keywords: ['nokia'], brandName: 'Nokia' },
      { keywords: ['huawei'], brandName: 'Huawei' },
      { keywords: ['honor'], brandName: 'Honor' },
      { keywords: ['symphony'], brandName: 'Symphony' },
      { keywords: ['walton'], brandName: 'Walton' },
      { keywords: ['sony', 'playstation', 'ps5', 'ps4'], brandName: 'Sony' },
      { keywords: ['jbl'], brandName: 'JBL' },
      { keywords: ['anker', 'soundcore'], brandName: 'Anker' },
      { keywords: ['baseus'], brandName: 'Baseus' },
      { keywords: ['joyroom'], brandName: 'Joyroom' },
      { keywords: ['remax'], brandName: 'Remax' },
      { keywords: ['hoco'], brandName: 'Hoco' },
      { keywords: ['oraimo'], brandName: 'Oraimo' },
      { keywords: ['haylou'], brandName: 'Haylou' },
      { keywords: ['amazfit'], brandName: 'Amazfit' },
      { keywords: ['colmi'], brandName: 'Colmi' },
      { keywords: ['lenovo', 'thinkpad', 'ideapad'], brandName: 'Lenovo' },
      { keywords: ['asus', 'rog', 'zenbook', 'vivobook'], brandName: 'ASUS' },
      { keywords: ['dell', 'inspiron', 'alienware'], brandName: 'Dell' },
      { keywords: ['hp', 'pavilion', 'elitebook'], brandName: 'HP' },
      { keywords: ['acer', 'predator'], brandName: 'Acer' },
      { keywords: ['msi'], brandName: 'MSI' },
      { keywords: ['logitech'], brandName: 'Logitech' },
      { keywords: ['razer'], brandName: 'Razer' },
      { keywords: ['corsair'], brandName: 'Corsair' },
      { keywords: ['fantech'], brandName: 'Fantech' },
      { keywords: ['havit'], brandName: 'Havit' },
      { keywords: ['a4tech'], brandName: 'A4Tech' },
      { keywords: ['canon'], brandName: 'Canon' },
      { keywords: ['nikon'], brandName: 'Nikon' },
      { keywords: ['gopro'], brandName: 'GoPro' },
      { keywords: ['dji'], brandName: 'DJI' },
      { keywords: ['casio', 'gshock'], brandName: 'Casio' },
      { keywords: ['rolex'], brandName: 'Rolex' },
      { keywords: ['curren'], brandName: 'Curren' },
      { keywords: ['naviforce'], brandName: 'Naviforce' },
      { keywords: ['skmei'], brandName: 'SKMEI' },
      { keywords: ['poedagar'], brandName: 'Poedagar' },
      { keywords: ['olevs'], brandName: 'OLEVS' },
      { keywords: ['titan'], brandName: 'Titan' },
      { keywords: ['nike'], brandName: 'Nike' },
      { keywords: ['adidas'], brandName: 'Adidas' },
      { keywords: ['puma'], brandName: 'Puma' },
      { keywords: ['gucci'], brandName: 'Gucci' },
      { keywords: ['louisvuitton'], brandName: 'Louis Vuitton' },
      { keywords: ['zara'], brandName: 'Zara' },
      { keywords: ['levi', 'levis'], brandName: "Levi's" },
      { keywords: ['aarong'], brandName: 'Aarong' },
      { keywords: ['bata'], brandName: 'Bata' },
      { keywords: ['apex'], brandName: 'Apex' },
      { keywords: ['lottto', 'lotto'], brandName: 'Lotto' },
      { keywords: ['philips'], brandName: 'Philips' },
      { keywords: ['panasonic'], brandName: 'Panasonic' },
      { keywords: ['lg'], brandName: 'LG' },
      { keywords: ['singer'], brandName: 'Singer' },
      { keywords: ['vision'], brandName: 'Vision' },
      { keywords: ['miyako'], brandName: 'Miyako' },
      { keywords: ['kemei'], brandName: 'Kemei' },
      { keywords: ['vintage', 't9'], brandName: 'Vintage' },
      { keywords: ['cerave'], brandName: 'CeraVe' },
      { keywords: ['theordinary'], brandName: 'The Ordinary' },
      { keywords: ['garnier'], brandName: 'Garnier' },
      { keywords: ['loreal'], brandName: "L'Oreal" },
      { keywords: ['dove'], brandName: 'Dove' },
      { keywords: ['nivea'], brandName: 'Nivea' },
    ];

    for (const rule of brandRules) {
      for (const kw of rule.keywords) {
        if (compactTitle.includes(kw) || title.includes(kw)) {
          return rule.brandName;
        }
      }
    }

    return 'No Brand';
  };

  // 🌟 ২. SMART DYNAMIC RATING, SOLD & MULTI-REVIEW GENERATOR (প্রতিটি প্রোডাক্টে আলাদা রিভিউ ও সোল্ড দেখাবে)
  const getProductSocialProof = (product: any) => {
    if (!product) {
      return {
        ratingScore: '4.9',
        ratingCount: 142,
        soldCount: 380,
        reviews: []
      };
    }

    // প্রোডাক্টের নাম এবং আইডি দিয়ে একটি ইউনিক নাম্বার (Seed) তৈরি করা
    const str = `${product.id || ''}_${product.name || 'nexa'}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 100000;
    }

    // আলাদা আলাদা রেটিং স্কোর (4.7, 4.8, 4.9, 5.0)
    const possibleScores = ['4.8', '4.9', '4.7', '5.0', '4.9', '4.8'];
    const ratingScore = possibleScores[hash % possibleScores.length];

    // আলাদা আলাদা রেটিং সংখ্যা (যেমন: 47 থেকে 390 এর মধ্যে)
    const ratingCount = 45 + (hash % 340);

    // আলাদা আলাদা সোল্ড সংখ্যা (রেটিং সংখ্যার চেয়ে ২-৩ গুণ বেশি, যাতে ১০০% বাস্তব মনে হয়)
    const soldMultiplier = 2 + (hash % 2);
    const soldCount = ratingCount * soldMultiplier + (hash % 45);

    // ২৪টি বাস্তবসম্মত বাংলাদেশি কাস্টমার রিভিউ পুল
    const allReviewsPool = [
      { name: 'তানভীর আহমেদ', date: '২ দিন আগে', stars: 5, text: 'আলহামদুলিল্লাহ, ছবির সাথে ১০০% মিল আছে। ডেলিভারি খুব দ্রুত পেয়েছি এবং প্যাকেজিং দারুণ ছিল।' },
      { name: 'সাদিয়া ইসলাম', date: '৪ দিন আগে', stars: 5, text: 'প্রোডাক্টের কোয়ালিটি দামের তুলনায় অনেক ভালো। হাতে পেয়ে চেক করে টাকা দিয়েছি, ধন্যবাদ!' },
      { name: 'মাহমুদুল হাসান রাকিব', date: '১ দিন আগে', stars: 5, text: 'অরিজিনাল প্রোডাক্ট পেয়েছি। প্রথমে একটু চিন্তায় ছিলাম, কিন্তু হাতে পাওয়ার পর মন ভরে গেছে। সেরা সার্ভিস!' },
      { name: 'নুসরাত জাহান মিম', date: '৫ দিন আগে', stars: 5, text: 'অনেক সুন্দর প্রোডাক্ট! যেমনটা চেয়েছিলাম ঠিক তেমনটাই পাঠিয়েছে। ডেলিভারি ম্যান ভাইয়াও খুব ভালো ছিলেন।' },
      { name: 'আরিফুল ইসলাম', date: '৩ দিন আগে', stars: 4, text: 'দাম অনুযায়ী কোয়ালিটি এক কথায় অসাধারণ। ঢাকার বাইরে ৩ দিনের মধ্যে ডেলিভারি পেয়েছি।' },
      { name: 'ফারহানা ইয়াসমিন', date: '১ সপ্তাহ আগে', stars: 5, text: 'এখান থেকে এটা আমার দ্বিতীয় অর্ডার। আগের বারের মতো এবারও ১০০% জেনুইন প্রোডাক্ট পেয়েছি। সবাই নিশ্চিন্তে নিতে পারেন।' },
      { name: 'জাহিদুল ইসলাম জয়', date: '৬ দিন আগে', stars: 5, text: 'প্যাকেজিং খুবই মজবুত ছিল। ভেতরে প্রোডাক্ট একদম নিখুঁত অবস্থায় পেয়েছি। ইনশাআল্লাহ আবার অর্ডার করব।' },
      { name: 'মেহেদী হাসান শুভ', date: '২ দিন আগে', stars: 5, text: 'বাজারের চেয়ে কম দামে এত ভালো কোয়ালিটির জিনিস পাবো ভাবিনি। কাস্টমার সাপোর্টও খুব আন্তরিক।' },
      { name: 'তাসনিম তাবাসসুম', date: 'গতকাল', stars: 5, text: 'অনেক প্রিমিয়াম লুক! গিফট দেওয়ার জন্য নিয়েছিলাম, সবাই অনেক পছন্দ করেছে। অসংখ্য ধন্যবাদ।' },
      { name: 'রাশেদুল করিম', date: '৪ দিন আগে', stars: 4, text: 'খুবই ভালো সার্ভিস। অর্ডার করার পরের দিনই হাতে পেয়েছি। কোয়ালিটি একদম পারফেক্ট।' },
      { name: 'সাব্বির হোসেন', date: '১ সপ্তাহ আগে', stars: 5, text: 'এক কথায় অস্থির প্রোডাক্ট! ডেলিভারির সময় খুলে চেক করে নেওয়ার সুবিধা থাকায় কোনো টেনশন ছিল না।' },
      { name: 'জান্নাতুল ফেরদৌস', date: '৩ দিন আগে', stars: 5, text: 'ছবিতে যেমন দেখেছি বাস্তবে তার চেয়েও বেশি সুন্দর। ফিনিশিং এবং কোয়ালিটি ১০ এ ১০!' },
      { name: 'শাকিল মাহমুদ', date: '৫ দিন আগে', stars: 5, text: 'আমি গত ১ সপ্তাহ ধরে ব্যবহার করছি, দারুণ কাজ করছে। এই বাজেটে সেরা ডিল বলা যায়।' },
      { name: 'নাজমুল হুদা', date: '২ দিন আগে', stars: 5, text: 'সেলার ভাই খুব দ্রুত রেসপন্স করেন। প্রোডাক্ট হাতে পেয়ে শতভাগ সন্তুষ্ট আমি।' },
      { name: 'রুবাইয়া তাবাসসুম', date: '৬ দিন আগে', stars: 4, text: 'প্রোডাক্টটি বেশ ভালো এবং দেখতে একদম ব্র্যান্ড নিউ। ডেলিভারি আরেকটু ফাস্ট হলে আরও ভালো হতো, তবে জিনিস খুব ভালো।' },
      { name: 'ইমরান হোসেন সাগর', date: '১ দিন আগে', stars: 5, text: 'এত কম দামে অরিজিনাল প্রোডাক্ট দেওয়ার জন্য ধন্যবাদ। বন্ধুদেরও সাজেস্ট করেছি আপনাদের শপের কথা।' },
      { name: 'কাজী ফাহিম', date: '৪ দিন আগে', stars: 5, text: 'প্রিমিয়াম কোয়ালিটি, হাতে নিলেই বোঝা যায় জিনিসটা কতটা ভালো। চোখ বন্ধ করে অর্ডার করতে পারেন।' },
      { name: 'শারমিন আক্তার নিপা', date: '১ সপ্তাহ আগে', stars: 5, text: 'অনলাইনে কেনাকাটায় মাঝে মাঝে ঠকতে হয়, কিন্তু এখান থেকে প্রোডাক্ট নিয়ে দারুণ অভিজ্ঞতা হলো। ১০০% রিকমেন্ডেড!' }
    ];

    // এই প্রোডাক্টের জন্য ইউনিক ৩টি রিভিউ সিলেক্ট করা (যাতে এক প্রোডাক্টের সাথে অন্য প্রোডাক্টের রিভিউ না মেলে)
    const totalReviews = allReviewsPool.length;
    const idx1 = hash % totalReviews;
    const idx2 = (hash + 5) % totalReviews;
    const idx3 = (hash + 11) % totalReviews;

    return {
      ratingScore,
      ratingCount,
      soldCount,
      reviews: [allReviewsPool[idx1], allReviewsPool[idx2], allReviewsPool[idx3]]
    };
  };

  // 🖼️ প্রোডাক্টের ৪টি ছবির গ্যালারি তৈরি করার ফাংশন
  const getProductGallery = (product: any) => {
    if (!product) return [];
    const customImages = [
      product.image_url,
      product.image_url_2 || product.image2,
      product.image_url_3 || product.image3,
      product.image_url_4 || product.image4,
    ].filter(Boolean);

    if (Array.isArray(product.images) && product.images.length >= 2) {
      return product.images.slice(0, 4).map((url: string) => ({
        url,
        imgClass: 'scale-100 object-center'
      }));
    }

    if (customImages.length >= 2) {
      return customImages.map((url) => ({
        url,
        imgClass: 'scale-100 object-center'
      }));
    }

    const mainImg = product.image_url;
    return [
      { url: mainImg, imgClass: 'scale-100 object-center' },
      { url: mainImg, imgClass: 'scale-125 object-center' },
      { url: mainImg, imgClass: 'scale-115 object-top' },
      { url: mainImg, imgClass: 'scale-115 object-bottom' },
    ];
  };

  // 💰 দাম ও কাটা দাম (Original Price) বের করার ফাংশন
  const getCleanPrice = (val: any) => Number(val?.toString().replace(/[^0-9]/g, '')) || 0;
  const getOriginalPrice = (product: any) => {
    const current = getCleanPrice(product?.price);
    const orig = getCleanPrice(product?.original_price);
    if (orig > current) return orig;
    return Math.round(current * 1.45);
  };

  // ব্যাকআপ প্রোডাক্ট তালিকা (ক্যাটাগরিসহ নিখুঁত ম্যাপিং)
  const defaultProducts = [
    { id: 1, name: 'iPhone 13 Pro Max - 128GB Flagship Phone', category: 'Electronics', price: '70000', original_price: '115000', discount: '-40%', rating: '5.0 (1.2k)', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' },
    { id: 2, name: 'T800 Ultra Smartwatch with Bluetooth Calling', category: 'Electronics', price: '500', original_price: '1200', discount: '-58%', rating: '4.8 (2.4k)', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
    { id: 3, name: 'M10 TWS Wireless Earbuds Deep Bass Bluetooth 5.1', category: 'Electronics', price: '380', original_price: '750', discount: '-49%', rating: '4.7 (3.5k)', image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80' },
    { id: 4, name: 'Men Loose Cargo Denim Jeans Pants Streetwear', category: 'Fashion & Beauty', price: '899', original_price: '1599', discount: '-45%', rating: '4.6 (950)', image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80' },
    { id: 5, name: 'Airtight Food Storage Container Bowl Set', category: 'Home & Living', price: '299', original_price: '499', discount: '-40%', rating: '4.6 (820)', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
    { id: 6, name: 'Premium Heavy Duty Hand Gripper Muscle Exerciser', category: 'Sports & Outdoors', price: '450', original_price: '750', discount: '-40%', rating: '4.7 (1.5k)', image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&q=80' },
    { id: 7, name: 'Fast Charging 20000mAh Power Bank Digital LED', category: 'Electronics', price: '1250', original_price: '2200', discount: '-43%', rating: '4.9 (840)', image_url: 'https://images.unsplash.com/photo-1609592426868-07e1124ef547?w=400&q=80' },
    { id: 8, name: 'Facial Roller & Skincare Serum Glow Set', category: 'Health & Care', price: '1299', original_price: '3299', discount: '-60%', rating: '4.8 (620)', image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' },
  ];

  useEffect(() => {
    async function fetchData() {
      const { data: pData } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (pData && pData.length > 0) {
        setProducts(pData);
      } else {
        setProducts(defaultProducts);
      }

      const { data: sData } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (sData) setSettings(sData);

      setLoading(false);
    }
    fetchData();
  }, []);

  // 🔍 স্মার্ট ফিল্টারিং লজিক
  const filteredProducts = products.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();

    if (name.includes(q) || cat.includes(q)) return true;

    if (q.includes('elect') && (name.includes('phone') || name.includes('watch') || name.includes('earbud') || name.includes('bank') || cat.includes('elect'))) return true;
    if (q.includes('fash') && (name.includes('jean') || name.includes('pant') || name.includes('shirt') || cat.includes('fash'))) return true;
    if (q.includes('home') && (name.includes('bowl') || name.includes('container') || cat.includes('home'))) return true;
    if (q.includes('health') && (name.includes('serum') || name.includes('roller') || cat.includes('health'))) return true;
    if (q.includes('sport') && (name.includes('gripper') || name.includes('gym') || cat.includes('sport'))) return true;

    return false;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setViewingProduct(null);
    setTimeout(() => scrollToProducts(), 100);
  };

  // কার্ট লজিক
  const addToCart = (product: any, e?: React.MouseEvent, customQty: number = 1) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + customQty } : item);
      }
      return [...prev, { ...product, qty: customQty }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const p = Number(item.price.toString().replace(/[^0-9]/g, '')) || 0;
    return sum + (p * item.qty);
  }, 0);

  // চেকআউট লজিক
  const openCheckout = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProduct(product);
    setPaymentMethod('cod');
    setTrxId('');
    setIsModalOpen(true);
    setOrderSuccess(false);
  };

  const isValidBDPhone = (phone: string) => {
    const cleaned = phone.replace(/[\s-]/g, "");
    if (/^01[3-9]\d{8}$/.test(cleaned)) return true;
    if (/^(\+880|880)1[3-9]\d{8}$/.test(cleaned)) return true;
    return false;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("দয়া করে আপনার নাম লিখুন।");
      return;
    }

    if (!isValidBDPhone(formData.phone)) {
      alert("সঠিক মোবাইল নাম্বার দিন। উদাহরণ: 01935133944");
      return;
    }

    if (formData.address.trim().length < 8) {
      alert("সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।");
      return;
    }

    if (paymentMethod !== 'cod' && trxId.trim().length < 4) {
      alert(`অনুগ্রহ করে ${paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'} Transaction ID বা শেষ ৪ ডিজিট লিখুন।`);
      return;
    }

    setIsSubmitting(true);
    const cleanedPhone = formData.phone.replace(/[\s-]/g, "").replace(/^(\+880|880)/, "0");

    const orderItemName = selectedProduct 
      ? selectedProduct.name 
      : cart.map(c => `${c.name} (${c.qty}x)`).join(', ');

    const rawCleanPrice = selectedProduct 
      ? String(selectedProduct.price).replace(/[^0-9.]/g, '')
      : String(cartTotal);

    const paymentNote = paymentMethod === 'cod'
      ? 'COD (ক্যাশ অন ডেলিভারি)'
      : `${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} (TrxID: ${trxId.trim().toUpperCase()})`;

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: formData.name.trim(),
        customer_phone: cleanedPhone,
        customer_address: `${formData.address.trim()} | পেমেন্ট: ${paymentNote}`,
        product_name: orderItemName,
        price: rawCleanPrice,
        status: 'Pending'
      }
    ]);

    if (!error) {
      setOrderSuccess(true);
      setFormData({ name: '', phone: '', address: '' });
      setTrxId('');
      setPaymentMethod('cod');
      if (!selectedProduct) setCart([]);
      setTimeout(() => {
        setIsModalOpen(false);
        setIsCartOpen(false);
      }, 3000);
    } else {
      alert("অর্ডার করতে সমস্যা হয়েছে: " + error.message);
    }
    setIsSubmitting(false);
  };

  const scrollToProducts = () => {
    const el = document.getElementById('just-for-you');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const payableAmount = selectedProduct 
    ? selectedProduct.price?.toString().replace(/[^0-9]/g, '') 
    : cartTotal;

  const sidebarCategories = [
    { name: "Electronics", query: "Electronics", icon: <Smartphone size={14} className="text-amber-400" /> },
    { name: "Fashion & Beauty", query: "Fashion", icon: <Shirt size={14} className="text-amber-400" /> },
    { name: "Home & Living", query: "Home", icon: <HomeIcon size={14} className="text-amber-400" /> },
    { name: "Health & Care", query: "Health", icon: <Heart size={14} className="text-amber-400" /> },
    { name: "Sports & Outdoors", query: "Sports", icon: <Trophy size={14} className="text-amber-400" /> },
    { name: "Toys & Games", query: "Toys", icon: <Gamepad2 size={14} className="text-amber-400" /> },
    { name: "Groceries", query: "Groceries", icon: <ShoppingBag size={14} className="text-amber-400" /> },
    { name: "More Categories", query: "", icon: <LayoutGrid size={14} className="text-amber-400" /> },
  ];

  const visualCategories = [
    { name: "Electronics", query: "Electronics", img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=150&q=80" },
    { name: "Fashion & Beauty", query: "Fashion", img: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=150&q=80" },
    { name: "Home & Living", query: "Home", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=150&q=80" },
    { name: "Health & Care", query: "Health", img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&q=80" },
    { name: "Sports & Outdoors", query: "Sports", img: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=150&q=80" },
    { name: "Toys & Games", query: "Toys", img: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=150&q=80" },
    { name: "Groceries", query: "Groceries", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80" },
    { name: "More Categories", query: "", img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150&q=80" },
  ];

  const galleryImages = getProductGallery(viewingProduct);
  const detectedBrand = getProductBrand(viewingProduct);
  const socialProof = getProductSocialProof(viewingProduct);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans selection:bg-amber-500 selection:text-black pb-24">

      {/* 🖼️ FULL SCREEN IMAGE LIGHTBOX (ছবির ওপর ক্লিক করলে বড় করে দেখার পপআপ) */}
      {isImageZoomOpen && viewingProduct && (
        <div 
          onClick={() => setIsImageZoomOpen(false)}
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <button 
            onClick={() => setIsImageZoomOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={22} />
          </button>
          <div className="relative flex items-center justify-center max-w-full max-h-[78vh] overflow-hidden rounded-xl border border-amber-500/30" onClick={(e) => e.stopPropagation()}>
            <img 
              src={galleryImages[activeImageIdx]?.url || viewingProduct.image_url} 
              alt={viewingProduct.name} 
              className={`max-w-full max-h-[76vh] object-contain transition-transform duration-300 ${galleryImages[activeImageIdx]?.imgClass || ''}`}
            />
          </div>
          <div className="flex items-center gap-2.5 mt-4" onClick={(e) => e.stopPropagation()}>
            {galleryImages.map((imgObj: (typeof galleryImages)[number], idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition cursor-pointer bg-[#14110c] ${
                  activeImageIdx === idx ? 'border-amber-400 scale-105' : 'border-white/20 opacity-50'
                }`}
              >
                <img src={imgObj.url} alt="" className={`w-full h-full object-cover ${imgObj.imgClass}`} />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-300 mt-3 font-semibold text-center max-w-md">{viewingProduct.name}</p>
        </div>
      )}

      {/* 🛍️ CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xs flex justify-end">
          <div className="bg-[#120f0a] w-full max-w-sm h-full shadow-2xl border-l border-amber-500/30 flex flex-col justify-between p-5 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-amber-400" />
                  <h3 className="font-bold text-base text-white">Your Cart ({cart.reduce((a, b) => a + b.qty, 0)})</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 text-xs py-10">আপনার কার্ট খালি রয়েছে।</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-[#1c1812] p-2.5 rounded-lg border border-amber-500/20">
                      <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-gray-200 line-clamp-1">{item.name}</h4>
                        <p className="text-xs font-black text-amber-400">৳{item.price}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateCartQty(item.id, -1)} className="w-5 h-5 bg-[#251e15] rounded border border-amber-500/30 flex items-center justify-center text-xs font-bold text-gray-300">-</button>
                          <span className="text-xs font-bold">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="w-5 h-5 bg-[#251e15] rounded border border-amber-500/30 flex items-center justify-center text-xs font-bold text-gray-300">+</button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="border-t border-amber-500/20 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-gray-400">Total Amount:</span>
                  <span className="text-base font-black text-amber-400">৳{cartTotal}</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    setPaymentMethod('cod');
                    setTrxId('');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold py-2.5 rounded-lg text-xs shadow-md transition uppercase tracking-wider cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📦 VIP CHECKOUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
          <div className="bg-[#120f0a] rounded-2xl w-full max-w-md p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.15)] border border-amber-500/40 max-h-[92vh] overflow-y-auto">
            {!orderSuccess && (
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                <X size={20} />
              </button>
            )}

            {orderSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 size={64} className="text-emerald-400 mx-auto mb-3 animate-bounce" />
                <h3 className="text-xl font-bold text-white mb-1">অর্ডার সফল হয়েছে! 🎉</h3>
                <p className="text-gray-400 text-xs">আমাদের প্রতিনিধি দ্রুত আপনার নাম্বারে কল করে অর্ডার কনফার্ম করবে।</p>
              </div>
            ) : (
              <>
                <div className="border-b border-amber-500/20 pb-3 mb-4">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-amber-400" /> অর্ডার কনফার্ম করুন
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    পণ্য: <span className="font-bold text-amber-400">{selectedProduct ? selectedProduct.name : `${cart.length} টি প্রোডাক্ট কার্টে আছে`}</span>
                  </p>
                </div>
                
                <form onSubmit={handleOrderSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">আপনার নাম *</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-[#1c1812] border border-amber-500/30 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 transition" 
                      placeholder="যেমন: মোঃ রহিম উদ্দিন" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">মোবাইল নাম্বার *</label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={14}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-[#1c1812] border border-amber-500/30 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 transition" 
                      placeholder="01935133944"
                    />
                    {formData.phone.length > 0 && !isValidBDPhone(formData.phone) && (
                      <p className="text-red-400 font-semibold text-[11px] mt-1">⚠️ সঠিক ১১ ডিজিটের বাংলাদেশি নাম্বার দিন</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
                    <textarea 
                      required 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      className="w-full bg-[#1c1812] border border-amber-500/30 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-400 resize-none h-16 transition" 
                      placeholder="বাসা নং, রোড, বাজার, থানা, জেলা..." 
                    />
                  </div>

                  {/* 💎 ভিআইপি পেমেন্ট মেথড কার্ড */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-gray-300 mb-2">পেমেন্ট মেথড সিলেক্ট করুন *</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      
                      {/* Cash on Delivery Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          paymentMethod === 'cod'
                            ? 'bg-gradient-to-b from-amber-500/20 to-[#1c1812] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-[#18140f] border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                            <Truck size={15} />
                          </span>
                          {paymentMethod === 'cod' && <CheckCircle2 size={14} className="text-amber-400" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-white leading-tight">ক্যাশ অন ডেলিভারি</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">হাতে পেয়ে পেমেন্ট</p>
                        </div>
                      </button>

                      {/* bKash Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bkash')}
                        className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          paymentMethod === 'bkash'
                            ? 'bg-gradient-to-b from-[#E2136E]/25 to-[#1c1017] border-[#E2136E] shadow-[0_0_18px_rgba(226,19,110,0.35)]'
                            : 'bg-[#18140f] border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#E2136E] text-white font-black text-[10px] tracking-wide shadow">
                            bKash
                          </span>
                          {paymentMethod === 'bkash' && <CheckCircle2 size={14} className="text-[#ff4da6]" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-white leading-tight">বিকাশ পেমেন্ট</p>
                          <p className="text-[9px] text-pink-300/80 mt-0.5">Send Money</p>
                        </div>
                      </button>

                      {/* Nagad Card */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('nagad')}
                        className={`relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          paymentMethod === 'nagad'
                            ? 'bg-gradient-to-b from-[#F7941D]/25 to-[#1f140d] border-[#F7941D] shadow-[0_0_18px_rgba(247,148,29,0.35)]'
                            : 'bg-[#18140f] border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#ED1C24] to-[#F7941D] text-white font-black text-[10px] tracking-wide shadow">
                            Nagad
                          </span>
                          {paymentMethod === 'nagad' && <CheckCircle2 size={14} className="text-orange-400" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-white leading-tight">নগদ পেমেন্ট</p>
                          <p className="text-[9px] text-orange-300/80 mt-0.5">Send Money</p>
                        </div>
                      </button>
                    </div>

                    {/* 🔥 আসল বিকাশ/নগদ গেটওয়ে বক্স */}
                    {paymentMethod !== 'cod' && (
                      <div className={`mt-3 rounded-xl overflow-hidden border transition-all duration-300 ${
                        paymentMethod === 'bkash' 
                          ? 'bg-[#1a0d14] border-[#E2136E]/60 shadow-[0_0_25px_rgba(226,19,110,0.15)]' 
                          : 'bg-[#1c110a] border-[#F7941D]/60 shadow-[0_0_25px_rgba(247,148,29,0.15)]'
                      }`}>
                        <div className={`px-3.5 py-2 flex items-center justify-between text-white ${
                          paymentMethod === 'bkash'
                            ? 'bg-gradient-to-r from-[#E2136E] to-[#a80b50]'
                            : 'bg-gradient-to-r from-[#ED1C24] to-[#F7941D]'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs uppercase tracking-wider">
                              {paymentMethod === 'bkash' ? 'bKash Send Money' : 'Nagad Send Money'}
                            </span>
                          </div>
                          <span className="text-xs font-black bg-black/25 px-2 py-0.5 rounded">
                            ৳{payableAmount}
                          </span>
                        </div>

                        <div className="p-3.5 space-y-3">
                          <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-400">পার্সোনাল নাম্বার (Send Money করুন)</p>
                              <p className="text-sm font-black tracking-wider text-white mt-0.5">{MERCHANT_NUMBER}</p>
                            </div>
                            <button
                              type="button"
                              onClick={copyNumber}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                copied 
                                  ? 'bg-emerald-500 text-black' 
                                  : paymentMethod === 'bkash'
                                    ? 'bg-[#E2136E] hover:bg-[#c81060] text-white'
                                    : 'bg-[#F7941D] hover:bg-[#df8112] text-black'
                              }`}
                            >
                              {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                            </button>
                          </div>

                          <div className="text-[11px] text-gray-300 space-y-1 bg-white/5 p-2.5 rounded-lg">
                            <p>১. উপরের নাম্বারে <b className="text-white">৳{payableAmount}</b> টাকা <b className="text-amber-400">Send Money</b> করুন।</p>
                            <p>২. টাকা পাঠানোর পর মেসেজে পাওয়া <b className="text-white">Transaction ID</b> বা যে নাম্বার থেকে পাঠিয়েছেন তার শেষ ৪ ডিজিট নিচে লিখুন:</p>
                          </div>

                          <div>
                            <input
                              type="text"
                              required
                              value={trxId}
                              onChange={(e) => setTrxId(e.target.value)}
                              placeholder={paymentMethod === 'bkash' ? "যেমন: BJM84K92L (বিকাশ TrxID) *" : "যেমন: 72N94KL2 (নগদ TrxID) *"}
                              className={`w-full bg-black/60 text-white rounded-lg px-3.5 py-2.5 text-xs font-bold tracking-wider outline-none border transition uppercase placeholder:normal-case placeholder:font-normal ${
                                paymentMethod === 'bkash'
                                  ? 'border-[#E2136E]/50 focus:border-[#E2136E]'
                                  : 'border-[#F7941D]/50 focus:border-[#F7941D]'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* টোটাল সামারি বার */}
                  <div className="bg-amber-950/40 p-2.5 rounded-lg flex items-center justify-between text-xs text-amber-200 font-semibold border border-amber-500/30">
                    <span>{paymentMethod === 'cod' ? 'ডেলিভারির সময় দেবেন:' : 'মোট পরিশোধযোগ্য:'}</span>
                    <span className="text-amber-400 font-black text-base">৳{payableAmount}</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || (formData.phone.length > 0 && !isValidBDPhone(formData.phone))}
                    className={`w-full font-black py-3 rounded-xl text-xs shadow-lg transition disabled:opacity-50 uppercase tracking-wider cursor-pointer ${
                      paymentMethod === 'bkash'
                        ? 'bg-gradient-to-r from-[#E2136E] to-[#ff3385] text-white shadow-[#E2136E]/25'
                        : paymentMethod === 'nagad'
                        ? 'bg-gradient-to-r from-[#ED1C24] to-[#F7941D] text-white shadow-[#F7941D]/25'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black'
                    }`}
                  >
                    {isSubmitting ? "প্রসেসিং..." : `অর্ডার নিশ্চিত করুন (৳${payableAmount})`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 👑 1. TOP UTILITY BAR */}
      <div className="bg-[#050505] text-gray-400 text-[11px] border-b border-amber-950/40">
        <div className="max-w-[1340px] mx-auto px-3 md:px-4 py-1.5 flex justify-between items-center gap-2">
          <div className="flex items-center gap-4 shrink-0">
            <span className="flex items-center gap-1 text-amber-400 font-bold whitespace-nowrap">
              👑 Welcome to Nexa!
            </span>
            <span className="hidden md:flex items-center gap-1 text-gray-400 whitespace-nowrap">
              <Truck size={12} className="text-amber-400" /> Free Delivery All Over Bangladesh
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4 whitespace-nowrap">
            <span className="hidden sm:inline hover:text-amber-400 cursor-pointer">Save More on App</span>
            <span className="hidden sm:inline hover:text-amber-400 cursor-pointer">Become a Seller</span>
            <span onClick={openHelp} className="hover:text-amber-400 cursor-pointer">Help & Support</span>
            <span className="hover:text-amber-400 cursor-pointer">Login | Sign Up</span>
          </div>
        </div>
      </div>

      {/* 👑 2. MAIN HEADER */}
      <header className="bg-[#0c0a07] border-b border-amber-500/20 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1340px] mx-auto px-3 md:px-4 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 md:gap-4">
          <div className="flex items-center gap-2 cursor-pointer order-1" onClick={() => { setViewingProduct(null); setSearchQuery(''); scrollToTop(); }}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 rotate-45 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <span className="-rotate-45 font-black text-black text-xs">N</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white ml-1">{settings.store_name}</h1>
          </div>

          <div onClick={() => setIsCartOpen(true)} className="relative cursor-pointer p-1 order-2 md:order-3">
            <ShoppingCart size={22} className="text-amber-400 hover:text-amber-300 transition" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-black">
              {cart.reduce((a, b) => a + b.qty, 0)}
            </span>
          </div>

          {/* 🔍 লাইভ সার্চ ইনপুট */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-auto md:flex-1 max-w-xl md:mx-2 relative order-3 md:order-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (viewingProduct) setViewingProduct(null); }}
              placeholder={`Search in ${settings.store_name}... (e.g. iPhone, Watch, Pant)`} 
              className="w-full bg-[#18140f] text-white rounded-full pl-4 sm:pl-5 pr-16 sm:pr-20 py-2.5 md:py-2 text-xs md:text-sm outline-none border border-amber-500/30 focus:border-amber-400 transition placeholder-gray-500"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black p-1.5 rounded-full hover:brightness-105 transition shadow-sm cursor-pointer"
            >
              <Search size={15} />
            </button>
          </form>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 🛍️ REAL DARAZ APP & WEB STYLE PRODUCT DETAILS PAGE */}
      {/* ===================================================================== */}
      {viewingProduct ? (
        <div className="max-w-[1340px] mx-auto px-2 sm:px-4 mt-2.5 animate-in fade-in duration-200">
          
          {/* Top Compact Navigation Bar */}
          <div className="flex items-center justify-between gap-2 bg-[#110e0a] border border-amber-500/20 rounded-xl px-3 py-2 mb-3">
            <button
              onClick={() => setViewingProduct(null)}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-extrabold cursor-pointer shrink-0"
            >
              <ChevronLeft size={16} /> Back to Shop
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 truncate">
              <span>Home</span>
              <ChevronRight size={12} />
              <span>{viewingProduct.category || 'Official Store'}</span>
              <ChevronRight size={12} />
              <span className="text-amber-400 font-semibold">{detectedBrand}</span>
              <ChevronRight size={12} />
              <span className="text-gray-200 font-semibold truncate max-w-[240px]">{viewingProduct.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isWishlisted ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-[#1a150e] border-amber-500/20 text-gray-300'
                }`}
              >
                <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: viewingProduct.name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("প্রোডাক্টের লিংক কপি হয়েছে!");
                  }
                }}
                className="p-1.5 rounded-lg bg-[#1a150e] border border-amber-500/20 text-gray-300 hover:text-amber-400 transition cursor-pointer"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* MAIN DARAZ PRODUCT CARD (3-Column Desktop / Sleek App Stack on Mobile) */}
          <div className="bg-[#110e09] border border-amber-500/25 rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
            
            {/* 1. LEFT COLUMN: 4-PHOTO GALLERY (একদম দারাজের মতো পরিষ্কার গ্যালারি) */}
            <div className="lg:col-span-4 p-3 sm:p-5 bg-[#0e0b07] border-b lg:border-b-0 lg:border-r border-amber-500/15">
              {/* বড় মেইন ছবি */}
              <div 
                onClick={() => setIsImageZoomOpen(true)}
                className="relative w-full aspect-square bg-[#17130d] rounded-xl overflow-hidden border border-amber-500/20 flex items-center justify-center cursor-zoom-in"
              >
                <img 
                  src={galleryImages[activeImageIdx]?.url || viewingProduct.image_url} 
                  alt={viewingProduct.name} 
                  className={`w-full h-full object-cover transition-transform duration-300 ${galleryImages[activeImageIdx]?.imgClass || ''}`}
                />

                {/* বাম-ডান ছবি পাল্টানোর বাটন */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-amber-400 text-white hover:text-black flex items-center justify-center transition cursor-pointer shadow"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-amber-400 text-white hover:text-black flex items-center justify-center transition cursor-pointer shadow"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Daraz Style 1/4 Counter Pill */}
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/15">
                  {activeImageIdx + 1}/{galleryImages.length}
                </div>
              </div>

              {/* নিচে ৪টি থাম্বনেইল ছবি (Click to switch image) */}
              <div className="grid grid-cols-4 gap-2.5 mt-3">
                {galleryImages.map((imgObj: (typeof galleryImages)[number], idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-[#17130d] transition-all cursor-pointer ${
                      activeImageIdx === idx 
                        ? 'ring-2 ring-amber-400 scale-[1.03] opacity-100 shadow-[0_0_12px_rgba(245,158,11,0.4)]' 
                        : 'border border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={imgObj.url} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className={`w-full h-full object-cover ${imgObj.imgClass}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. MIDDLE COLUMN: DARAZ FLASH BANNER, TITLE, DYNAMIC RATINGS, QTY & ACTIONS */}
            <div className="lg:col-span-5 p-3.5 sm:p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-amber-500/15">
              <div>
                {/* ⚡ DARAZ STYLE FLASH DEAL PRICE BANNER */}
                <div className="bg-gradient-to-r from-[#261a07] via-[#1c1306] to-[#140e05] border border-amber-500/40 rounded-xl p-3 mb-3.5 shadow-inner">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      <Zap size={11} fill="currentColor" /> Flash Deal
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold">
                      ✓ Cash on Delivery Available
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                      ৳{getCleanPrice(viewingProduct.price) * detailQty}
                    </span>
                    <span className="text-sm sm:text-base text-gray-400 line-through font-bold">
                      ৳{getOriginalPrice(viewingProduct) * detailQty}
                    </span>
                    <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded">
                      {viewingProduct.discount || '-40%'}
                    </span>
                  </div>
                </div>

                {/* 🏷️ DARAZ MALL INLINE BADGE + PRODUCT TITLE */}
                <div className="mb-2.5">
                  <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-white leading-snug">
                    <span className="inline-block bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded mr-2 align-middle uppercase tracking-wider">
                      Mall
                    </span>
                    {viewingProduct.name}
                  </h1>
                </div>

                {/* ⭐ DYNAMIC RATING, SOLD & AUTO-BRAND ROW (প্রতিটি প্রোডাক্টে আলাদা সংখ্যা দেখাবে) */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-300 pb-3 mb-3 border-b border-amber-500/15">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center text-amber-400">
                      <Star size={13} fill="currentColor" />
                      <Star size={13} fill="currentColor" />
                      <Star size={13} fill="currentColor" />
                      <Star size={13} fill="currentColor" />
                      <Star size={13} fill="currentColor" />
                    </div>
                    <span className="font-bold text-amber-400 ml-0.5">{socialProof.ratingScore}</span>
                    <span className="text-gray-400">({socialProof.ratingCount})</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-300 font-semibold">{socialProof.soldCount}+ Sold</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-400">
                    Brand: <b className="text-amber-400">{detectedBrand}</b>
                  </span>
                </div>

                {/* 🎁 VOUCHER / PROMO TAGS (Daraz Style) */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Gift size={12} className="text-amber-400" /> Save ৳{(getOriginalPrice(viewingProduct) - getCleanPrice(viewingProduct.price)) * detailQty} Today
                  </span>
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-400" /> 100% Authentic
                  </span>
                </div>

                {/* Brand & Category Spec Strip */}
                <div className="grid grid-cols-2 gap-2 bg-[#16120c] border border-amber-500/15 rounded-xl p-2.5 mb-4 text-xs">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Brand</span>
                    <span className="font-bold text-amber-400">{detectedBrand}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">Category</span>
                    <span className="font-bold text-white">{viewingProduct.category || 'Official Collection'}</span>
                  </div>
                </div>

                {/* 🔢 QUANTITY SELECTOR */}
                <div className="flex items-center justify-between bg-[#16120c] border border-amber-500/20 rounded-xl px-3.5 py-2 mb-4">
                  <span className="text-xs font-bold text-gray-300">Quantity (পরিমাণ)</span>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                      className="w-7 h-7 rounded-lg bg-[#241d14] border border-amber-500/30 text-white font-black text-sm flex items-center justify-center hover:bg-amber-400 hover:text-black transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-amber-400 min-w-[22px] text-center">{detailQty}</span>
                    <button 
                      type="button"
                      onClick={() => setDetailQty(detailQty + 1)}
                      className="w-7 h-7 rounded-lg bg-[#241d14] border border-amber-500/30 text-white font-black text-sm flex items-center justify-center hover:bg-amber-400 hover:text-black transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 🛒 ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={(e) => addToCart(viewingProduct, e, detailQty)}
                  className="bg-[#1c1710] hover:bg-amber-500/15 border-2 border-amber-400 text-amber-400 font-extrabold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  onClick={() => {
                    const unitPrice = getCleanPrice(viewingProduct.price);
                    openCheckout({
                      ...viewingProduct,
                      name: detailQty > 1 ? `${viewingProduct.name} (${detailQty}x)` : viewingProduct.name,
                      price: String(unitPrice * detailQty)
                    });
                  }}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Zap size={16} fill="currentColor" /> এক্ষুনি অর্ডার করুন
                </button>
              </div>
            </div>

            {/* 3. RIGHT COLUMN: DARAZ DELIVERY, WARRANTY & OFFICIAL SELLER CARD */}
            <div className="lg:col-span-3 p-3.5 sm:p-5 bg-[#14100b] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                  <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Delivery Options</span>
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <MapPin size={12} /> Bangladesh
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <Truck size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-bold text-white">Standard Home Delivery</p>
                    </div>
                    <p className="text-[11px] text-gray-400">ঢাকায় ১-২ দিন, ঢাকার বাইরে ২-৪ দিন</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">Cash on Delivery Available</p>
                    <p className="text-[11px] text-gray-400">পণ্য হাতে পেয়ে দেখে পেমেন্ট করুন</p>
                  </div>
                </div>

                <div className="border-t border-amber-500/15 pt-3 space-y-2.5">
                  <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block">Return & Warranty</span>
                  <div className="flex items-start gap-2.5 text-xs">
                    <RotateCcw size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">7 Days Easy Return</p>
                      <p className="text-[11px] text-gray-400">ত্রুটিপূর্ণ পণ্য সহজেই পরিবর্তনযোগ্য</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <Award size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">100% Authentic Guaranteed</p>
                      <p className="text-[11px] text-gray-400">অরিজিনাল ও প্রিমিয়াম কোয়ালিটি</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🏪 DARAZ STYLE OFFICIAL STORE / SELLER CARD */}
              <div className="bg-[#1b160f] border border-amber-500/25 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-black font-black flex items-center justify-center text-sm shrink-0">
                    N
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-white truncate">Sold by {settings.store_name}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">✓ Verified Mall Seller</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center bg-black/30 rounded-lg py-1.5 border border-white/5">
                  <div>
                    <p className="text-xs font-black text-amber-400">98%</p>
                    <p className="text-[9px] text-gray-400">Positive</p>
                  </div>
                  <div className="border-x border-white/10">
                    <p className="text-xs font-black text-white">99%</p>
                    <p className="text-[9px] text-gray-400">On-Time</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-400">100%</p>
                    <p className="text-[9px] text-gray-400">Chat Reply</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`হ্যালো, আমি "${viewingProduct.name}" (দাম: ৳${viewingProduct.price}) অর্ডার করতে চাই।`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition"
                  >
                    <MessageCircle size={13} /> Chat Now
                  </a>
                  <button
                    onClick={() => setViewingProduct(null)}
                    className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Store size={13} /> Visit Store
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ⭐ DARAZ STYLE DYNAMIC RATINGS & REVIEWS + PRODUCT DESCRIPTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
            {/* প্রোডাক্টের বিবরণ */}
            <div className="lg:col-span-6 bg-[#110e09] border border-amber-500/20 rounded-2xl p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-extrabold text-amber-400 border-b border-amber-500/15 pb-2.5 mb-3">
                Product Details of {viewingProduct.name}
              </h3>
              <div className="text-xs sm:text-sm text-gray-300 space-y-2.5 leading-relaxed">
                <p>✅ <b>মডেল / নাম:</b> {viewingProduct.name}</p>
                <p>✅ <b>ব্র্যান্ড (Brand):</b> {detectedBrand}</p>
                <p>✅ <b>ক্যাটাগরি:</b> {viewingProduct.category || 'Official Flagship'}</p>
                <p>✅ <b>কোয়ালিটি:</b> ১০০% অরিজিনাল এবং প্রিমিয়াম কোয়ালিটি প্রোডাক্ট।</p>
                <p>✅ <b>চেকিং সুবিধা:</b> ডেলিভারি ম্যানের সামনে প্রোডাক্ট খুলে দেখে তারপর টাকা পরিশোধ করতে পারবেন।</p>
                <p>✅ <b>রিটার্ন পলিসি:</b> পণ্যে কোনো সমস্যা থাকলে ৭ দিনের মধ্যে সহজ রিপ্লেসমেন্ট সুবিধা।</p>
                {viewingProduct.description && <p className="mt-2 text-gray-200">{viewingProduct.description}</p>}
              </div>
            </div>

            {/* কাস্টমার রিভিউ সেকশন (প্রতিটি প্রোডাক্টে আলাদা ৩টি করে ভেরিফাইড রিভিউ দেখাবে) */}
            <div className="lg:col-span-6 bg-[#110e09] border border-amber-500/20 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-amber-500/15 pb-2.5 mb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Ratings & Reviews ({socialProof.ratingCount})
                  </h3>
                  <p className="text-[10px] text-gray-400">100% Verified Buyers from Bangladesh</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-400 text-xs font-black">
                  <Star size={13} fill="currentColor" /> {socialProof.ratingScore} / 5.0
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                {socialProof.reviews.map((rev, index) => (
                  <div key={index} className="bg-[#18130c] border border-amber-500/15 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rev.name}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">✓ Verified Purchase</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{rev.date}</span>
                    </div>
                    <div className="flex items-center text-amber-400 mb-1">
                      {Array.from({ length: rev.stars }).map((_, sIdx) => (
                        <Star key={sIdx} size={11} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 🔥 DARAZ "YOU MAY ALSO LIKE" (নিচে অনেকগুলো প্রোডাক্ট দেখাবে) */}
          {/* ===================================================================== */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 bg-[#110e0a] border border-amber-500/20 rounded-xl px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-400 fill-amber-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    আরও প্রোডাক্ট দেখুন (You May Also Like)
                  </h3>
                  <p className="text-[10px] text-amber-400/80">যেকোনো প্রোডাক্টের ওপর ক্লিক করে ৪টি ছবি ও বিস্তারিত দেখুন</p>
                </div>
              </div>
              <button
                onClick={() => { setViewingProduct(null); scrollToTop(); }}
                className="text-xs font-bold text-amber-400 hover:underline cursor-pointer shrink-0"
              >
                সব দেখুন →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {products.filter(p => p.id !== viewingProduct.id).map((item) => {
                const itemProof = getProductSocialProof(item);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => openProductDetails(item)}
                    className="bg-[#120f0a] rounded-xl p-2.5 shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition duration-200 flex flex-col justify-between border border-amber-500/20 hover:border-amber-400 group cursor-pointer"
                  >
                    <div>
                      <div className="relative w-full aspect-square bg-[#1b1610] rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          {item.discount || '-40%'}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-gray-200 line-clamp-1 mb-1 group-hover:text-amber-400 transition">
                        {item.name}
                      </h4>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-amber-400 font-black text-sm">
                          ৳{getCleanPrice(item.price)}
                        </span>
                        <span className="text-gray-500 line-through text-[10px]">
                          ৳{getOriginalPrice(item)}
                        </span>
                      </div>

                      <div className="flex items-center text-amber-400 text-[10px] mt-0.5 mb-2">
                        <Star size={10} fill="currentColor" />
                        <span className="ml-1 text-gray-400">{itemProof.ratingScore} ({itemProof.ratingCount})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-amber-500/15">
                      <button 
                        onClick={(e) => addToCart(item, e)}
                        className="bg-[#1c1812] hover:bg-amber-400/10 border border-amber-500/30 hover:border-amber-400 text-amber-400 text-[11px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart size={11} /> Cart
                      </button>
                      <button 
                        onClick={(e) => openCheckout(item, e)}
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black text-[11px] font-black py-1.5 rounded-lg transition shadow-md flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 📱 DARAZ APP STYLE MOBILE STICKY BOTTOM BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-[115] lg:hidden bg-[#100d08]/95 backdrop-blur-md border-t border-amber-500/30 px-3 py-2 flex items-center gap-2 shadow-[0_-8px_25px_rgba(0,0,0,0.85)]">
            <button
              onClick={() => setViewingProduct(null)}
              className="flex flex-col items-center justify-center px-2.5 py-1 text-gray-300 hover:text-amber-400 transition cursor-pointer"
            >
              <Store size={17} className="text-amber-400" />
              <span className="text-[10px] font-bold mt-0.5">Store</span>
            </button>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`হ্যালো, আমি "${viewingProduct.name}" সম্পর্কে জানতে চাই।`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center px-2.5 py-1 text-gray-300 hover:text-[#25D366] transition"
            >
              <MessageCircle size={17} className="text-[#25D366]" />
              <span className="text-[10px] font-bold mt-0.5">Chat</span>
            </a>

            <button
              onClick={(e) => addToCart(viewingProduct, e, detailQty)}
              className="flex-1 bg-[#1c1812] border border-amber-400 text-amber-400 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShoppingCart size={14} /> Add to Cart
            </button>

            <button
              onClick={() => {
                const unitPrice = getCleanPrice(viewingProduct.price);
                openCheckout({
                  ...viewingProduct,
                  name: detailQty > 1 ? `${viewingProduct.name} (${detailQty}x)` : viewingProduct.name,
                  price: String(unitPrice * detailQty)
                });
              }}
              className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <Zap size={14} fill="currentColor" /> অর্ডার করুন
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ===================================================================== */}
          {/* 👑 3. HERO CONTAINER (মোবাইল ও পিসিতে ১০০% ফিট ব্যানার) */}
          {/* ===================================================================== */}
          <div className="max-w-[1340px] mx-auto px-2 md:px-4 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              
              {/* Left Categories Sidebar */}
              <div className="hidden lg:block lg:col-span-3 bg-[#110e0a] rounded-2xl p-4 shadow-xl border border-amber-500/20">
                <div className="flex items-center gap-2 font-bold text-white text-xs mb-3 pb-2 border-b border-amber-500/20">
                  <Menu size={16} className="text-amber-400" />
                  <span>All Categories</span>
                </div>
                <ul className="space-y-1">
                  {sidebarCategories.map((cat, i) => (
                    <li 
                      key={i} 
                      onClick={() => { setSearchQuery(cat.query); scrollToProducts(); }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer transition"
                    >
                      <span className="flex items-center gap-2.5">
                        {cat.icon}
                        {cat.name}
                      </span>
                      <ChevronRight size={13} className="text-amber-500/40" />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Banner — মোবাইলে পুরোপুরি সেট হবে, একটুও কাটবে না */}
              <div className={`lg:col-span-9 rounded-2xl relative overflow-hidden border-2 border-amber-500/40 shadow-xl ${
                settings.hero_image 
                  ? 'bg-[#0d0a06] flex items-center justify-center min-h-[165px] sm:min-h-[260px] md:min-h-[350px]' 
                  : 'bg-gradient-to-r from-[#0d0a06] via-[#1c1409] to-[#0a0805] p-4 sm:p-6 md:p-10 flex flex-col justify-center min-h-[190px] sm:min-h-[270px] md:min-h-[350px]'
              }`}>
                {settings.hero_image ? (
                  <img 
                    src={settings.hero_image} 
                    alt="Hero Banner" 
                    className="w-full h-auto max-h-[220px] sm:max-h-none sm:h-full object-contain sm:object-cover object-center block" 
                  />
                ) : (
                  <>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-0 right-0 w-80 h-32 border-t-2 border-r-2 border-amber-400/40 rounded-tr-2xl pointer-events-none" />

                    <div className="relative z-10 max-w-[62%] sm:max-w-sm md:max-w-md">
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest inline-block mb-1 sm:mb-2">
                        NEXA
                      </span>
                      <h3 className="text-lg sm:text-2xl md:text-3xl font-serif italic text-white font-bold leading-tight">
                        Big Fashion
                      </h3>
                      <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 italic tracking-tight leading-none mb-1 sm:mb-2">
                        SALE
                      </h2>
                      <p className="text-sm sm:text-2xl md:text-3xl font-extrabold text-white mb-3 sm:mb-6">
                        Up to <span className="text-amber-400">70% OFF</span>
                      </p>
                      <button 
                        onClick={scrollToProducts}
                        className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black px-4 sm:px-7 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 sm:gap-2 transition w-max cursor-pointer"
                      >
                        Shop Now <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="absolute right-0 sm:right-4 md:right-16 bottom-0 top-0 w-[42%] sm:w-auto flex items-end justify-end pointer-events-none">
                      <img 
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" 
                        alt="Nexa Model" 
                        className="h-[96%] sm:h-[105%] w-full sm:w-auto object-cover object-top drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] filter brightness-105"
                      />
                    </div>

                    <div className="absolute right-8 top-10 hidden md:block text-right pointer-events-none">
                      <p className="text-2xl font-serif italic text-amber-200/90 leading-tight">Be Stylish</p>
                      <p className="text-3xl font-serif italic font-bold text-white">Be Nexa</p>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* ⚡ 4. [আসল গোল্ডেন স্ট্রিপ] */}
            <div className="mt-4 bg-gradient-to-r from-[#0c0904] via-[#1a1308] to-[#0c0904] rounded-2xl p-3 md:p-3.5 border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-wrap items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-black tracking-wide leading-tight">Flash Sale</h4>
                  <p className="text-[11px] text-amber-400 font-semibold">On Sale Now</p>
                </div>
                <button 
                  onClick={scrollToProducts}
                  className="w-7 h-7 rounded-full border border-amber-400/40 hover:border-amber-400 flex items-center justify-center text-amber-400 hover:bg-amber-400/10 transition ml-1 cursor-pointer"
                >
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-3 border-x border-amber-500/20 px-8">
                <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Gift size={22} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 leading-tight">
                    Up to 80% OFF
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">Limited Time Offer</p>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-2">
                  <Crown size={22} className="text-amber-400 fill-amber-400" />
                  <div>
                    <p className="text-sm font-black text-white leading-tight">Tech Deals</p>
                    <p className="text-[11px] text-amber-400 font-bold">Live Now</p>
                  </div>
                </div>
                <button 
                  onClick={scrollToProducts}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs px-5 py-2 rounded-full shadow-md shadow-amber-500/30 flex items-center gap-1.5 transition ml-2 cursor-pointer"
                >
                  Shop Now <ArrowRight size={13} />
                </button>
              </div>
            </div>

          </div>

          {/* ⚡ 5. FLASH SALE PRODUCTS */}
          <div className="max-w-[1340px] mx-auto px-2 md:px-4 mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-amber-400 fill-amber-400" />
                <div>
                  <h3 className="text-base font-black text-white leading-none">Flash Sale</h3>
                  <span className="text-[11px] text-amber-400 font-semibold">On Sale Now</span>
                </div>
              </div>
              <button 
                onClick={() => { setSearchQuery(''); scrollToProducts(); }}
                className="text-[11px] font-bold text-amber-400 hover:text-white border border-amber-500/40 hover:border-amber-400 px-3 py-1 rounded transition uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                Shop All Products <ArrowRight size={12} />
              </button>
            </div>

            {/* Top Flash Sale Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {products.slice(0, 6).map((item) => {
                const itemProof = getProductSocialProof(item);
                return (
                  <div 
                    key={item.id} 
                    onClick={() => openProductDetails(item)}
                    className="bg-[#120f0a] rounded-xl p-2.5 shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition duration-200 flex flex-col justify-between border border-amber-500/20 hover:border-amber-400 group cursor-pointer"
                  >
                    <div>
                      <div className="relative w-full aspect-square bg-[#1b1610] rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          {item.discount || '-40%'}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-gray-200 line-clamp-1 mb-1 group-hover:text-amber-400 transition">
                        {item.name}
                      </h4>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-amber-400 font-black text-sm">
                          ৳{getCleanPrice(item.price)}
                        </span>
                        <span className="text-gray-500 line-through text-[10px]">
                          ৳{getOriginalPrice(item)}
                        </span>
                      </div>

                      <div className="flex items-center text-amber-400 text-[10px] mt-0.5 mb-2">
                        <Star size={10} fill="currentColor" />
                        <span className="ml-1 text-gray-400">{itemProof.ratingScore} ({itemProof.ratingCount})</span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => openCheckout(item, e)}
                      className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black py-1.5 rounded-lg text-[11px] shadow-md transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    >
                      Buy Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔲 6. CATEGORIES SECTION */}
          <div className="max-w-[1340px] mx-auto px-2 md:px-4 mt-10">
            <div className="bg-[#110e0a] rounded-2xl p-4 shadow-xl border border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={18} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Categories</h3>
                </div>
                <span className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer" onClick={() => { setSearchQuery(''); scrollToProducts(); }}>
                  See All <ArrowRight size={12} />
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {visualCategories.map((cat, i) => (
                  <div 
                    key={i} 
                    onClick={() => { setSearchQuery(cat.query); scrollToProducts(); }}
                    className="bg-[#18140f] hover:bg-[#221c15] p-2.5 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition border border-amber-500/10 hover:border-amber-400/40 group"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden mb-1.5 bg-[#251e15] p-1 shadow-xs flex items-center justify-center">
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-cover rounded group-hover:scale-110 transition duration-300" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 line-clamp-1 group-hover:text-amber-400 transition">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🔥 7. JUST FOR YOU (ক্লিক করলে প্রোডাক্টের বিস্তারিত পেজ ওপেন হবে) */}
          <div id="just-for-you" className="max-w-[1340px] mx-auto px-2 md:px-4 mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-amber-400 fill-amber-400" />
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    {searchQuery ? `Products in: "${searchQuery}"` : "Just For You"}
                  </h3>
                  <p className="text-[11px] text-amber-400/80 font-medium">
                    {searchQuery ? `${filteredProducts.length} items found` : "প্রোডাক্টের বিস্তারিত ও ৪টি ছবি দেখতে যেকোনো প্রোডাক্টের ওপর ক্লিক করুন"}
                  </p>
                </div>
              </div>

              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs bg-[#1c1812] border border-amber-500/40 hover:border-amber-400 text-amber-400 px-3 py-1 rounded-full transition flex items-center gap-1 cursor-pointer"
                >
                  Show All Products <X size={12} />
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-[#110e0a] rounded-2xl border border-amber-500/20">
                <Search size={40} className="text-gray-600 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-gray-300">"{searchQuery}" দিয়ে কোনো প্রোডাক্ট পাওয়া যায়নি</h4>
                <p className="text-xs text-gray-500 mt-1">অন্য কোনো নাম দিয়ে সার্চ করুন অথবা ফিল্টার ক্লিয়ার করুন।</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs px-5 py-2 rounded-full cursor-pointer"
                >
                  সব প্রোডাক্ট দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {filteredProducts.map((item) => {
                  const itemProof = getProductSocialProof(item);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => openProductDetails(item)}
                      className="bg-[#120f0a] rounded-xl p-2.5 shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition duration-200 flex flex-col justify-between border border-amber-500/20 hover:border-amber-400 group cursor-pointer"
                    >
                      <div>
                        <div className="relative w-full aspect-square bg-[#1b1610] rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                            {item.discount || '-35%'}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-gray-200 line-clamp-1 mb-1 group-hover:text-amber-400 transition">
                          {item.name}
                        </h4>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-amber-400 font-black text-sm">
                            ৳{getCleanPrice(item.price)}
                          </span>
                          <span className="text-gray-500 line-through text-[10px]">
                            ৳{getOriginalPrice(item)}
                          </span>
                        </div>

                        <div className="flex items-center text-amber-400 text-[10px] mt-0.5 mb-2">
                          <Star size={10} fill="currentColor" />
                          <span className="ml-1 text-gray-400">{itemProof.ratingScore} ({itemProof.ratingCount})</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-amber-500/15">
                        <button 
                          onClick={(e) => addToCart(item, e)}
                          className="bg-[#1c1812] hover:bg-amber-400/10 border border-amber-500/30 hover:border-amber-400 text-amber-400 text-[11px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart size={11} /> Cart
                        </button>
                        <button 
                          onClick={(e) => openCheckout(item, e)}
                          className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black text-[11px] font-black py-1.5 rounded-lg transition shadow-md flex items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 🧾 8. FOOTER */}
      <footer className="mt-14 bg-[#0b0906] border-t border-amber-500/20">
        <div className="max-w-[1340px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-left">

          {/* Brand + Contact */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-amber-400" />
              <h3 className="text-lg font-black tracking-widest text-amber-400">{settings.store_name}</h3>
            </div>
            <ul className="space-y-3 text-[11px] text-gray-400">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0"><Phone size={12} /></span>
                <a href={"tel:" + HELPLINE_NUMBER} className="hover:text-amber-400 transition leading-5">{HELPLINE_NUMBER}</a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0"><Mail size={12} /></span>
                <a href={"mailto:" + STORE_EMAIL} className="hover:text-amber-400 transition leading-5 break-all">{STORE_EMAIL}</a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0"><MapPin size={12} /></span>
                <span className="leading-5">{STORE_ADDRESS}</span>
              </li>
            </ul>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-7 h-7 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/40 transition cursor-pointer"><Facebook size={13} /></span>
              <span className="w-7 h-7 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/40 transition cursor-pointer"><Instagram size={13} /></span>
              <span className="w-7 h-7 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/40 transition cursor-pointer"><Youtube size={13} /></span>
              <span className="w-7 h-7 rounded-md bg-[#1c1812] border border-amber-500/20 flex items-center justify-center text-gray-400 hover:text-amber-400 hover:border-amber-400/40 transition cursor-pointer"><Music2 size={13} /></span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-amber-400" />
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Shop</h4>
            </div>
            <ul className="space-y-2 text-[11px] text-gray-400">
              <li><button onClick={() => { setViewingProduct(null); setSearchQuery(''); scrollToProducts(); }} className="hover:text-amber-400 transition cursor-pointer">All Products</button></li>
              <li><button onClick={() => { setViewingProduct(null); setSearchQuery('Electronics'); scrollToProducts(); }} className="hover:text-amber-400 transition cursor-pointer">New Arrivals</button></li>
              <li><button onClick={() => { setViewingProduct(null); setSearchQuery('Fashion'); scrollToProducts(); }} className="hover:text-amber-400 transition cursor-pointer">Best Sellers</button></li>
              <li><button onClick={() => { setViewingProduct(null); setSearchQuery(''); scrollToProducts(); }} className="hover:text-amber-400 transition cursor-pointer">Deals & Offers</button></li>
              <li><button onClick={() => { setViewingProduct(null); setSearchQuery(''); scrollToProducts(); }} className="hover:text-amber-400 transition cursor-pointer">Categories</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-amber-400" />
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Support</h4>
            </div>
            <ul className="space-y-2 text-[11px] text-gray-400">
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">About Us</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">Contact Us</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">FAQs</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">Warranty Policy</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">Returns & Refunds</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">Track Order</button></li>
            </ul>
          </div>

          {/* Account + We Accept */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-amber-400" />
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Account</h4>
            </div>
            <ul className="space-y-2 text-[11px] text-gray-400 mb-5">
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">My Account</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">Order History</button></li>
              <li><button onClick={openHelp} className="hover:text-amber-400 transition cursor-pointer">Wishlist</button></li>
              <li><button onClick={() => setIsCartOpen(true)} className="hover:text-amber-400 transition cursor-pointer">Shopping Cart</button></li>
            </ul>

            <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">We Accept</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-[#E2136E] text-white text-[9px] font-black px-2 py-1 rounded">bKash</span>
              <span className="bg-gradient-to-r from-[#ED1C24] to-[#F7941D] text-white text-[9px] font-black px-2 py-1 rounded">Nagad</span>
              <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-1 rounded">CASH</span>
              <span className="bg-[#1a1f71] text-white text-[9px] font-black px-2 py-1 rounded italic">VISA</span>
              <span className="bg-white text-[#EB001B] text-[9px] font-black px-2 py-1 rounded border border-neutral-300">Mastercard</span>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-500/15">
          <div className="max-w-[1340px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
            <span>© 2026 {settings.store_name}. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <button onClick={openHelp} className="hover:text-amber-400 cursor-pointer">Privacy Policy</button>
              <button onClick={openHelp} className="hover:text-amber-400 cursor-pointer">Terms of Service</button>
              <button onClick={openHelp} className="hover:text-amber-400 cursor-pointer">Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ⬆️ Scroll to Top */}
      <button
        onClick={scrollToTop}
        title="উপরে যান"
        className={`fixed right-5 z-[135] w-10 h-10 rounded-full bg-[#E2136E] hover:bg-[#c81060] text-white flex items-center justify-center shadow-[0_0_15px_rgba(226,19,110,0.45)] transition cursor-pointer ${
          viewingProduct ? 'bottom-[138px] lg:bottom-[84px]' : 'bottom-[84px]'
        }`}
      >
        <ChevronUp size={18} />
      </button>

      {/* 💬 "কীভাবে সাহায্য করতে পারি?" পপআপ */}
      {isHelpOpen && (
        <div className={`fixed right-5 z-[140] w-[290px] max-w-[calc(100vw-40px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-in slide-in-from-bottom-2 duration-200 ${
          viewingProduct ? 'bottom-[190px] lg:bottom-[136px]' : 'bottom-[136px]'
        }`}>
          <div className="px-4 pt-4 pb-3 border-b border-neutral-200 relative">
            <h4 className="text-[15px] font-extrabold text-neutral-900 leading-tight">কীভাবে সাহায্য করতে পারি?</h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">WhatsApp, Messenger অথবা ফোনে কথা বলুন</p>
            <button
              onClick={closeHelp}
              className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="divide-y divide-neutral-200">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition group">
              <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0">
                <MessageCircle size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-neutral-800">হোয়াটসঅ্যাপে মেসেজ</span>
                <span className="block text-[11px] text-neutral-500">সবচেয়ে সহজ উপায়</span>
              </span>
              <ChevronRight size={15} className="text-neutral-400 group-hover:text-neutral-600" />
            </a>

            <a href={MESSENGER_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition group">
              <span className="w-9 h-9 rounded-full bg-[#0084FF] flex items-center justify-center text-white shrink-0">
                <Send size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-neutral-800">মেসেঞ্জারে চ্যাট</span>
                <span className="block text-[11px] text-neutral-500">ফেসবুক পেজে কথা বলুন</span>
              </span>
              <ChevronRight size={15} className="text-neutral-400 group-hover:text-neutral-600" />
            </a>

            <a href={"tel:" + HELPLINE_NUMBER} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition group">
              <span className="w-9 h-9 rounded-full bg-[#E2136E] flex items-center justify-center text-white shrink-0">
                <Phone size={17} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-neutral-800">ফোন করুন</span>
                <span className="block text-[11px] text-neutral-500">{HELPLINE_NUMBER}</span>
              </span>
              <ChevronRight size={15} className="text-neutral-400 group-hover:text-neutral-600" />
            </a>
          </div>
        </div>
      )}

      {/* 🎧 Floating Help Button */}
      <button
        onClick={() => (isHelpOpen ? closeHelp() : openHelp())}
        title={isHelpOpen ? "বন্ধ করুন" : "কাস্টমার কেয়ার"}
        className={`fixed right-5 z-[150] w-12 h-12 rounded-full bg-[#E2136E] hover:bg-[#c81060] text-white flex items-center justify-center shadow-[0_0_20px_rgba(226,19,110,0.5)] transition hover:scale-105 cursor-pointer ${
          viewingProduct ? 'bottom-[74px] lg:bottom-5' : 'bottom-5'
        }`}
      >
        {isHelpOpen ? <X size={22} /> : <Headphones size={22} />}
      </button>

    </div>
  );
}