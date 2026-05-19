import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Compass,
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  Trash2,
  Bell,
  Send,
  Camera,
  Upload,
  PieChart,
  DollarSign,
  Briefcase,
  HelpCircle,
  Menu,
  RotateCcw,
  X,
  Smartphone,
  Info
} from "lucide-react";
import Markdown from "react-markdown";

// Types
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: "food" | "transport" | "utilities" | "entertainment" | "shopping" | "other";
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  insights?: {
    highestSpender?: { name: string; amount: number; icon: string };
    newAddition?: { name: string; amount: number; icon: string };
  };
}

// Fixed constant default budget
const DEFAULT_BUDGET = 3500;

export default function App() {
  // Tabs: "home" | "assistant" | "add" | "analytics"
  const [activeTab, setActiveTab] = useState<"home" | "assistant" | "add" | "analytics">("home");

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("para_takip_txs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Kayıtlı işlemler yüklenemedi:", e);
      }
    }
    // Default initial transactions (perfectly matching Wed, 14th visual state)
    return [
      {
        id: "tx-coffee",
        title: "Kahve Keyfi (Coffee Shop)",
        amount: 60,
        type: "expense",
        category: "food",
        date: "2026-05-14",
        time: "08:30 AM"
      },
      {
        id: "tx-groceries",
        title: "Süpermarket Alışverişi (Groceries)",
        amount: 450,
        type: "expense",
        category: "shopping",
        date: "2026-05-14",
        time: "12:15 PM"
      },
      {
        id: "tx-freelance",
        title: "Freelance Ek Gelir",
        amount: 3200,
        type: "income",
        category: "other",
        date: "2026-05-14",
        time: "02:00 PM"
      },
      {
        id: "tx-past1",
        title: "Yemek Kartı Dolumu",
        amount: 1500,
        type: "income",
        category: "food",
        date: "2026-05-12",
        time: "09:00 AM"
      },
      {
        id: "tx-past2",
        title: "Metrobüs Geçişi",
        amount: 45,
        type: "expense",
        category: "transport",
        date: "2026-05-13",
        time: "06:15 PM"
      }
    ];
  });

  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem("para_takip_budget");
    return saved ? parseFloat(saved) : DEFAULT_BUDGET;
  });

  // Calendar horizontal sliding days
  const [selectedDate, setSelectedDate] = useState<string>("2026-05-14");
  const daysArray = [
    { dateStr: "2026-05-12", label: "Mon", dayNum: "12" },
    { dateStr: "2026-05-13", label: "Tue", dayNum: "13" },
    { dateStr: "2026-05-14", label: "Wed", dayNum: "14" },
    { dateStr: "2026-05-15", label: "Thu", dayNum: "15" },
    { dateStr: "2026-05-16", label: "Fri", dayNum: "16" },
    { dateStr: "2026-05-17", label: "Sat", dayNum: "17" },
    { dateStr: "2026-05-18", label: "Sun", dayNum: "18" }
  ];

  // Quick category filters on home tab
  const [homeFilter, setHomeFilter] = useState<string>("all");

  // Chat helper states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("para_takip_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Chat geçmişi yüklenemedi:", e);
      }
    }
    return [
      {
        id: "m-1",
        sender: "user",
        text: "Bu ayki abonelik harcamalarımın dökümünü verir misin?"
      },
      {
        id: "m-2",
        sender: "assistant",
        text: "Bu ay abonelikler ve düzenli ödemeler için **1200 TL** harcadınız. Bu miktar geçen aya kıyasla **+150 TL** daha yüksek.",
        insights: {
          highestSpender: { name: "Netflix", amount: 450, icon: "movie" },
          newAddition: { name: "Spor Salonu", amount: 300, icon: "fitness_center" }
        }
      }
    ];
  });
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Manual Addform states
  const [addAmount, setAddAmount] = useState<string>("");
  const [addTitle, setAddTitle] = useState<string>("");
  const [addCategory, setAddCategory] = useState<"food" | "transport" | "utilities" | "entertainment" | "shopping" | "other">("food");
  const [addDate, setAddDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [addType, setAddType] = useState<"income" | "expense">("expense");

  // Vision Scanning states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [scannedFileName, setScannedFileName] = useState<string>("");
  const [recentScans, setRecentScans] = useState<Array<{ id: string; name: string; status: "Analyzed" | "Processing" | "Failed"; date: string }>>([
    { id: "s-1", name: "Luigi's Akşam Yemeği Fişi", status: "Analyzed", date: "Bugün, 20:42 PM" },
    { id: "s-2", name: "IMG_8492.jpg (CarrefourSA)", status: "Processing", date: "Şu an yükleniyor..." }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isAiTyping]);

  // Sync to database simulated via localStorage
  useEffect(() => {
    localStorage.setItem("para_takip_txs", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("para_takip_budget", budget.toString());
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("para_takip_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Calculations
  const totalIncome = transactions
    .filter((tx) => tx.type === "income" && tx.date === selectedDate)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense" && tx.date === selectedDate)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const todaysBalance = 2450.00 + totalIncome - totalExpense; // seeded base of 2450 in layout

  const currentMonthTransactions = transactions.filter(tx => {
    // Treat everything as current month
    return true;
  });

  const overallSpentThisMonth = currentMonthTransactions
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Upcoming items - state so they are interactive
  const [upcomingJobs, setUpcomingJobs] = useState([
    { id: "up-1", title: "Streaming Servis Üyeliği", amount: 120, when: "Yarın", category: "entertainment", icon: "play-circle" },
    { id: "up-2", title: "Kira Ödemesi", amount: 8500, when: "3 gün sonra", category: "utilities", icon: "home" }
  ]);

  // Remove transaction helper
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Quick suggestion chips questions triggers
  const handleSuggestedPrompt = async (promptText: string) => {
    setChatInput("");
    const userMsg: ChatMessage = {
      id: "m-user-" + Date.now(),
      sender: "user",
      text: promptText
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText,
          transactions: transactions,
          budget: budget
        })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: "m-bot-" + Date.now(),
        sender: "assistant",
        text: data.text || "Üzgünüm, şu an sorunuza yanıt veremiyorum."
      };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch (e: any) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: "m-bot-err-" + Date.now(),
        sender: "assistant",
        text: "Hata oluştu. Lütfen Gemini API bağlantınızı doğrulayın ve tekrar deneyin."
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Chat submit logic
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const messageToSend = chatInput;
    setChatInput("");

    const userMsg: ChatMessage = {
      id: "m-user-" + Date.now(),
      sender: "user",
      text: messageToSend
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          transactions: transactions,
          budget: budget
        })
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: "m-bot-" + Date.now(),
        sender: "assistant",
        text: data.text || "Bağlantıda sorun bulunuyor. Lütfen tekrar deneyin."
      };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch (e: any) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: "m-bot-err-" + Date.now(),
        sender: "assistant",
        text: "Üzgünüm, asistan şu an ulaşılamaz durumda. Lütfen sunucunun açık olduğundan ve .env dosyanızın geçerli bir GEMINI_API_KEY barındırdığından emin olun."
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Convert uploaded image to base64 and call camera Gemini receipt parser
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannedFileName(file.name);
    setIsScanning(true);
    setScanStatus("Dosya okunuyor...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      if (!base64String) {
        setIsScanning(false);
        return;
      }

      const strippedBase64 = base64String.split(",")[1];
      const mimeType = file.type;

      setScanStatus("Gemini faturayı inceliyor (Tutar, Mağaza Bilgileri ve Tarih Çıkartılıyor)...");

      // Add a processing item to recent scans
      const newScanId = "s-" + Date.now();
      setRecentScans(prev => [
        { id: newScanId, name: file.name, status: "Processing", date: "Yükleniyor..." },
        ...prev
      ]);

      try {
        const response = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: strippedBase64,
            mimeType: mimeType
          })
        });

        if (!response.ok) throw new Error("Tarama başarısız oldu.");
        const data = await response.json();

        // Autoload into form
        if (data.amount) setAddAmount(data.amount.toString());
        if (data.title) setAddTitle(data.title);
        if (data.category) setAddCategory(data.category);
        if (data.date) setAddDate(data.date);

        setScanStatus("Başarılı! Veriler forma aktarıldı.");
        setRecentScans(prev => prev.map(s => s.id === newScanId ? { ...s, status: "Analyzed" as const, date: "Az önce analiz edildi" } : s));

        setTimeout(() => {
          setIsScanning(false);
        }, 1500);

      } catch (err: any) {
        console.error(err);
        setScanStatus("Fatura tarama başarısız. Lütfen bilgileri manuel girin.");
        setRecentScans(prev => prev.map(s => s.id === newScanId ? { ...s, status: "Failed" as const, date: "Okunamadı" } : s));
        setTimeout(() => {
          setIsScanning(false);
        }, 2000);
      }
    };

    reader.readAsDataURL(file);
  };

  // Visual simulation selector of preset Receipts
  const simulateDemoScan = async (demoType: "luigi" | "starbucks" | "migros") => {
    setIsScanning(true);
    setScannedFileName(
      demoType === "luigi"
        ? "Luigi_Italian_Restaurant_Fişi.png"
        : demoType === "starbucks"
        ? "Starbucks_Coffee_Faturası.jpg"
        : "Migros_Supermarket_Alisveris.pdf"
    );

    const demoDataMap = {
      luigi: { title: "Luigi's Italian", amount: 235.00, category: "food" as const, date: "2026-05-14" },
      starbucks: { title: "Starbucks Coffee", amount: 85.00, category: "food" as const, date: "2026-05-14" },
      migros: { title: "Migros T.A.Ş.", amount: 410.50, category: "shopping" as const, date: "2026-05-14" }
    };

    const targetData = demoDataMap[demoType];

    setScanStatus("Demo Fiş Yükleniyor...");
    await new Promise((r) => setTimeout(r, 800));
    setScanStatus("Özel Tarayıcı Animasyonu Çalışıyor...");
    await new Promise((r) => setTimeout(r, 1000));
    setScanStatus("Gemini Vision AI verileri yapılandırıyor...");
    await new Promise((r) => setTimeout(r, 900));

    // Autoload into UI Form fields
    setAddAmount(targetData.amount.toString());
    setAddTitle(targetData.title);
    setAddCategory(targetData.category);
    setAddDate(targetData.date);
    setAddType("expense");

    // Add to recent scans list
    setRecentScans(prev => [
      { id: "s-demo-" + Date.now(), name: targetData.title + " Fişi (Simüle)", status: "Analyzed", date: "Az önce analiz edildi" },
      ...prev
    ]);

    setScanStatus("Tamamlandı! Form alanları dolduruldu.");
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  // Submit Expense Form manually
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || isNaN(parseFloat(addAmount)) || parseFloat(addAmount) <= 0) {
      alert("Lütfen geçerli bir tutar girin.");
      return;
    }
    if (!addTitle.trim()) {
      alert("Lütfen bir harcama veya gelir başlığı belirtin.");
      return;
    }

    const newTx: Transaction = {
      id: "tx-" + Date.now(),
      title: addTitle,
      amount: parseFloat(addAmount),
      type: addType,
      category: addCategory,
      date: addDate,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };

    setTransactions(prev => [newTx, ...prev]);

    // Reset Form Fields
    setAddAmount("");
    setAddTitle("");
    setAddCategory("food");

    // Redirect user with beautiful transition back to home showing updated timeline
    setActiveTab("home");
  };

  // Reset demo account transactions
  const handleResetData = () => {
    if (confirm("Uygulama verilerini sıfırlamak istediğinizden emin misiniz?")) {
      localStorage.removeItem("para_takip_txs");
      localStorage.removeItem("para_takip_chat");
      localStorage.removeItem("para_takip_budget");
      window.location.reload();
    }
  };

  // Pre-calculations for Analytics categories aggregates
  const categoriesList = [
    { key: "food", name: "Yemek & Restoran", color: "bg-amber-500", barColor: "bg-amber-600", text: "text-amber-800", icon: "restaurant" },
    { key: "shopping", name: "Alışveriş & Market", color: "bg-blue-500", barColor: "bg-blue-600", text: "text-blue-800", icon: "shopping_cart" },
    { key: "transport", name: "Ulaşım & Seyahat", color: "bg-emerald-500", barColor: "bg-emerald-600", text: "text-emerald-800", icon: "directions_car" },
    { key: "utilities", name: "Kira & Faturalar", color: "bg-purple-500", barColor: "bg-purple-600", text: "text-purple-800", icon: "home" },
    { key: "entertainment", name: "Eğlence & Sosyal", color: "bg-pink-500", barColor: "bg-pink-600", text: "text-pink-800", icon: "smart_display" },
    { key: "other", name: "Diğer Ödemeler", color: "bg-gray-500", barColor: "bg-gray-600", text: "text-gray-800", icon: "payments" }
  ];

  const categoryAggregate = categoriesList.map((catObj) => {
    const sum = transactions
      .filter((tx) => tx.type === "expense" && tx.category === catObj.key)
      .reduce((s, tx) => s + tx.amount, 0);
    return {
      ...catObj,
      sum
    };
  }).sort((a, b) => b.sum - a.sum);

  const maxVal = Math.max(...categoryAggregate.map((c) => c.sum), 1);

  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#051a3e] font-sans transition-colors duration-200 antialiased flex flex-col justify-between">
      
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100">
              <img
                alt="Profil Resmi"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
              />
            </div>
            <div>
              <h1 className="font-display font-medium text-lg text-blue-900 tracking-tight flex items-center gap-1.5">
                Para Takip
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h1>
              <p className="text-xs text-gray-500 font-sans tracking-wide">Akıllı Finansal Yönetim</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleResetData}
              title="Verileri Sıfırla" 
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-95 duration-150"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <div className="relative p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer rounded-full transition-colors">
              <Bell className="w-5 h-5 pointer-events-none" />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container Core Canvas */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Large Left Column / Dynamic Tab Context (Grid Spans 8 cols on desktop) */}
        <section className="col-span-1 md:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: HOME PANEL */}
            {activeTab === "home" && (
              <motion.div
                key="home-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Horizontal Calendar Sliding bar */}
                <div className="bg-white p-3 rounded-2xl shadow-ambient border border-blue-50/50">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-xs font-semibold text-blue-900/60 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Takvim Akışı
                    </span>
                    <span className="text-xs text-gray-400 font-medium">Mayıs 2026</span>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                    {daysArray.map((day) => {
                      const isActive = selectedDate === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => setSelectedDate(day.dateStr)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl min-w-[62px] cursor-pointer transition-all duration-200 active:scale-95 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-medium scale-105"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-semibold ${isActive ? "text-blue-100" : "text-gray-400"}`}>
                            {day.label}
                          </span>
                          <span className="text-base font-display font-semibold mt-0.5">
                            {day.dayNum}
                          </span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1 animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Net Balance Colored Gradient card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-6 shadow-xl shadow-blue-950/20">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col gap-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-100/80 uppercase tracking-widest block mb-1">
                        Seçilen Günün Net Dengesi
                      </span>
                      <div className="font-display text-3xl font-bold tracking-tight flex items-baseline gap-1.5">
                        <span className="text-2xl text-blue-200 font-display">₺</span>{todaysBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-blue-200/80 uppercase tracking-wider flex items-center gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> TOPLAM GELİR
                        </span>
                        <span className="font-display font-bold text-lg text-emerald-300">
                          ₺{totalIncome.toLocaleString("tr-TR")}
                        </span>
                      </div>
                      
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-semibold text-blue-200/80 uppercase tracking-wider flex items-center justify-end gap-1">
                          TOPLAM GİDER <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                        </span>
                        <span className="font-display font-bold text-lg text-rose-300">
                          ₺{totalExpense.toLocaleString("tr-TR")}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Transactions list header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="font-display font-semibold text-lg text-blue-950 flex items-center gap-2">
                      İşlemler <span className="text-xs font-sans text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{transactions.filter(t => t.date === selectedDate).length} adet</span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <select 
                        value={homeFilter}
                        onChange={(e) => setHomeFilter(e.target.value)}
                        className="text-xs bg-white border border-gray-200 rounded-lg py-1 px-2.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="all">Tüm Kategoriler</option>
                        <option value="food">Yemek</option>
                        <option value="shopping">Alışveriş</option>
                        <option value="transport">Ulaşım</option>
                        <option value="utilities">Faturalar</option>
                        <option value="entertainment">Eğlence</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                  </div>

                  {/* Transactions dynamic render timeline thread */}
                  <div className="relative pl-3 space-y-4">
                    {/* Thread Line overlay */}
                    <div className="absolute left-[20px] top-6 bottom-4 w-0.5 bg-gray-100 pointer-events-none"></div>

                    {transactions.filter(t => t.date === selectedDate).length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl text-center border border-dashed border-gray-200 space-y-2">
                        <p className="text-gray-400 text-sm">Bu seçili tarih ({selectedDate}) için herhangi bir işlem kaydı bulunamadı.</p>
                        <button
                          onClick={() => setActiveTab("add")}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                        >
                          <Plus className="w-3.5 h-3.5" /> İşlem Ekle
                        </button>
                      </div>
                    ) : (
                      transactions
                        .filter(t => t.date === selectedDate)
                        .filter(t => homeFilter === "all" || t.category === homeFilter)
                        .map((tx) => {
                          const catObj = categoriesList.find((c) => c.key === tx.category);
                          return (
                            <motion.div
                              layoutId={tx.id}
                              key={tx.id}
                              className="flex items-start gap-3.5 relative group"
                            >
                              {/* Left icon timeline anchor */}
                              <div className={`w-9 h-9 rounded-full ${tx.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"} flex items-center justify-center shrink-0 z-10 border border-white shadow-sm ring-4 ring-white`}>
                                {tx.type === "income" ? (
                                  <ArrowDownLeft className="w-5 h-5" />
                                ) : (
                                  <ArrowUpRight className="w-5 h-5" />
                                )}
                              </div>

                              {/* Target content bubble */}
                              <div className="flex-1 bg-white p-4 rounded-2xl shadow-ambient hover:shadow-elevated transition-all border border-gray-100/50 flex items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-sm text-blue-950 group-hover:text-blue-600 transition-colors">
                                    {tx.title}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <span className="capitalize font-medium text-blue-900/40 bg-gray-50 px-1.5 py-0.5 rounded">
                                      {catObj?.name || tx.category}
                                    </span>
                                    <span>•</span>
                                    <span>{tx.time}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className={`font-display font-bold text-sm ${tx.type === "income" ? "text-emerald-600" : "text-gray-800"}`}>
                                    {tx.type === "income" ? "+" : "-"} ₺{tx.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 2: AI ASSISTANT CHAT PANEL */}
            {activeTab === "assistant" && (
              <motion.div
                key="assistant-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-2xl shadow-ambient border border-gray-100 flex flex-col h-[580px] overflow-hidden"
              >
                {/* Agent Header Info */}
                <div className="p-4 border-b border-gray-100 bg-[#faf9ff]/80 backdrop-blur-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-blue-950">Yapay Zeka Finans Asistanı</h3>
                      <p className="text-[10px] text-gray-400 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                        Aktif Harcama Analizi devrede
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setChatHistory([
                        {
                          id: "m-welcome-reset",
                          sender: "assistant",
                          text: "Merhaba! Güncel bütçe verileriniz asistan belleğine başarıyla yüklendi. Harcamalarınızı sormaya başlayabilirsiniz."
                        }
                      ]);
                    }}
                    title="Sohbeti Temizle" 
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chat Stream History Canvas */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  <div className="flex justify-center my-1">
                    <span className="bg-gray-50 text-gray-400 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border border-gray-100 shadow-xs">
                      Bugün
                    </span>
                  </div>

                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} w-full items-start gap-2`}
                    >
                      {msg.sender === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                          <Compass className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%]`}>
                        <div className={`p-3.5 rounded-2xl text-sm ${
                          msg.sender === "user"
                            ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10"
                            : "bg-gray-50 border border-gray-100/80 text-gray-800 rounded-tl-none shadow-xs"
                        }`}>
                          <div className="prose prose-sm prose-blue leading-relaxed break-words font-sans">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                          
                          {/* Mini insights inside layout bubble */}
                          {msg.insights && (
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                              <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">En Yüksek</span>
                                <div className="flex items-center gap-1 my-0.5 text-blue-950 font-bold text-xs">
                                  <span>🎬</span>
                                  <span>{msg.insights.highestSpender?.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-rose-500">{msg.insights.highestSpender?.amount} TL</span>
                              </div>
                              <div className="bg-white p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Yeni Ödeme</span>
                                <div className="flex items-center gap-1 my-0.5 text-emerald-950 font-bold text-xs">
                                  <span>🏋️</span>
                                  <span>{msg.insights.newAddition?.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600">{msg.insights.newAddition?.amount} TL</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing simulated state */}
                  {isAiTyping && (
                    <div className="flex justify-start items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Clock className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none p-3 text-xs text-gray-400 font-sans flex items-center gap-1.5">
                        <span className="animate-pulse">Para Asistanı yazıyor...</span>
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Smart Suggestion Quick Chips */}
                <div className="px-4 py-2 border-t border-gray-100 bg-[#faf9ff]/50 overflow-x-auto hide-scrollbar flex gap-2">
                  <button
                    onClick={() => handleSuggestedPrompt("Harcamalarımı özetle ve tasarruf tavsiyesi ver.")}
                    className="whitespace-nowrap shrink-0 text-xs bg-white hover:bg-blue-50 text-blue-700 font-medium px-3 py-1.5 rounded-full border border-blue-100 transition-colors"
                  >
                    📊 Harcamaları Özetle
                  </button>
                  <button
                    onClick={() => handleSuggestedPrompt("Bütçemin ne kadarı kaldı? Aşmaktan nasıl kaçınabilirim?")}
                    className="whitespace-nowrap shrink-0 text-xs bg-white hover:bg-blue-50 text-blue-700 font-medium px-3 py-1.5 rounded-full border border-blue-100 transition-colors"
                  >
                    💳 Bütçemi Analiz Et
                  </button>
                  <button
                    onClick={() => handleSuggestedPrompt("Fatura ve abonelik giderlerim nedir?")}
                    className="whitespace-nowrap shrink-0 text-xs bg-white hover:bg-blue-50 text-blue-700 font-medium px-3 py-1.5 rounded-full border border-blue-100 transition-colors"
                  >
                    🧾 Aboneliklerimi Göster
                  </button>
                </div>

                {/* Typing Input Section */}
                <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                  <div className="flex-1 relative bg-gray-50 border border-gray-200 rounded-full focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all flex items-center overflow-hidden">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Para durumunuzla ilgili soru sorun..."
                      disabled={isAiTyping}
                      className="w-full bg-transparent px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isAiTyping}
                      className="p-2.5 mr-1 text-white bg-blue-600 rounded-full hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>

              </motion.div>
            )}

            {/* TAB 3: SMART SCAN RECEIPT & ADD EXPENSE */}
            {activeTab === "add" && (
              <motion.div
                key="add-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                
                {/* Visual Smart Scanner Tool (Left component inside Add) */}
                <div className="md:col-span-6 bg-white rounded-2xl shadow-ambient border border-gray-100 p-5 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-blue-950 flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-blue-600" /> Akıllı Fiş Tarama
                    </h3>
                    <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded-full bg-blue-100 text-blue-700 tracking-wider">
                      Gemini Vision
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed font-sans">
                    Alışveriş fişinizin fotoğrafını yükleyin veya sürükleyin. Yapay zeka, Mağaza adını, Toplam tutarı ve Kategoriyi saniyeler içinde doğrudan forma aktaracaktır.
                  </p>

                  {/* Drag-And-Drop / File Viewfinder Box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full aspect-[4/3] bg-gray-50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                      isScanning 
                        ? "border-blue-500 bg-blue-50/10 pointer-events-none" 
                        : "border-gray-200 hover:border-blue-400 hover:bg-gray-100/50"
                    }`}
                  >
                    
                    {/* Corner Viewfinders */}
                    <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-blue-600 rounded-tl-md pointer-events-none"></div>
                    <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-blue-600 rounded-tr-md pointer-events-none"></div>
                    <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-blue-600 rounded-bl-md pointer-events-none"></div>
                    <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-blue-600 rounded-br-md pointer-events-none"></div>

                    {/* Animated scanning line when scanning */}
                    {isScanning && (
                      <div className="absolute left-6 right-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded scanning-anim shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10"></div>
                    )}

                    <div className="flex flex-col items-center gap-3">
                      {isScanning ? (
                        <>
                          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-bounce">
                            <Camera className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-blue-700 animate-pulse">{scanStatus}</p>
                            <p className="text-[10px] text-gray-400 font-mono italic max-w-xs truncate">{scannedFileName}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Bir Fiş Fotoğrafı Yükle</p>
                            <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, BMP veya WebP desteklenir</p>
                          </div>
                        </>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Preset Quick Demo Receipts Simulation Buttons */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      Hızlı Demo Fiş Simülasyonu (Fatura Yoksa)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => simulateDemoScan("luigi")}
                        className="p-2 text-left bg-[#faf9ff] hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl transition-all cursor-pointer text-xs space-y-1 active:scale-95 flex flex-col justify-between h-20"
                      >
                        <span className="font-semibold text-gray-800 line-clamp-1">🍕 Luigi's Italian</span>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] text-gray-400">Yemek</span>
                          <span className="font-bold text-[10px] text-blue-700">235 ₺</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => simulateDemoScan("starbucks")}
                        className="p-2 text-left bg-[#faf9ff] hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl transition-all cursor-pointer text-xs space-y-1 active:scale-95 flex flex-col justify-between h-20"
                      >
                        <span className="font-semibold text-gray-800 line-clamp-1">☕️ Starbucks</span>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] text-gray-400">Yemek</span>
                          <span className="font-bold text-[10px] text-blue-700">85 ₺</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => simulateDemoScan("migros")}
                        className="p-2 text-left bg-[#faf9ff] hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl transition-all cursor-pointer text-xs space-y-1 active:scale-95 flex flex-col justify-between h-20"
                      >
                        <span className="font-semibold text-gray-800 line-clamp-1">🛒 Migros Market</span>
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] text-gray-400">Alışveriş</span>
                          <span className="font-bold text-[10px] text-blue-700">410.5 ₺</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Scans Tracker list */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Geçmiş Aramalar ve Tarayıcılar</h4>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {recentScans.map((rs) => (
                        <div key={rs.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-white text-gray-400">🧾</span>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-700 max-w-[140px] md:max-w-[180px] truncate">{rs.name}</span>
                              <span className="text-[9px] text-gray-400">{rs.date}</span>
                            </div>
                          </div>
                          
                          {rs.status === "Analyzed" ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] flex items-center gap-0.5 shadow-xs">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> Tamamlandı
                            </span>
                          ) : rs.status === "Failed" ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[9px]">
                              Hata
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[9px] animate-pulse">
                              Taranıyor
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Expense Details Entry Box Form (Right component inside Add) */}
                <form onSubmit={handleSaveExpense} className="md:col-span-6 bg-white rounded-2xl shadow-ambient border border-gray-100 p-5 space-y-4">
                  
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-semibold text-blue-950 text-base">Manuel İşlem Girişi</h3>
                    
                    {/* Choose between Income and Expense Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold shadow-xs">
                      <button
                        type="button"
                        onClick={() => setAddType("expense")}
                        className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                          addType === "expense"
                            ? "bg-rose-500 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Gider
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddType("income")}
                        className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                          addType === "income"
                            ? "bg-emerald-500 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Gelir
                      </button>
                    </div>
                  </div>

                  {/* Outlined Custom Inputs */}
                  {/* AMOUNT INPUT */}
                  <div className="relative pt-1">
                    <label className="absolute top-0 left-3 bg-white px-1.5 text-[10px] font-bold uppercase text-blue-600 tracking-wider">
                      Tutar (TL)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-display font-semibold text-lg text-gray-400">₺</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-12 pl-8 pr-4 bg-transparent border-2 border-blue-500 hover:border-blue-600 rounded-xl font-display font-bold text-lg text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  {/* TITLE INPUT */}
                  <div className="relative pt-1">
                    <label className="absolute top-0 left-3 bg-white px-1.5 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      Açıklama / Mağaza Adı
                    </label>
                    <input
                      type="text"
                      required
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      placeholder="Örn: Carrefour, Starbucks Burger, Maaş Ödemesi"
                      className="w-full h-11 px-4 bg-transparent border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-sans text-blue-950 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* CATEGORIES PICKER */}
                  <div className="relative pt-1">
                    <label className="absolute top-0 left-3 bg-white px-1.5 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      Kategori
                    </label>
                    <select
                      value={addCategory}
                      onChange={(e: any) => setAddCategory(e.target.value)}
                      className="w-full h-11 px-3 bg-transparent border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-sans text-blue-950 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
                    >
                      <option value="food">🍱 Yemek & Restoran</option>
                      <option value="shopping">🛒 Alışveriş & Market</option>
                      <option value="transport">🚗 Ulaşım & Seyahat</option>
                      <option value="utilities">🏢 Kira & Faturalar</option>
                      <option value="entertainment">🎬 Eğlence & Sosyal</option>
                      <option value="other">💵 Diğer İşlemler</option>
                    </select>
                  </div>

                  {/* DATE PICKER */}
                  <div className="relative pt-1">
                    <label className="absolute top-0 left-3 bg-white px-1.5 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      Tarih
                    </label>
                    <input
                      type="date"
                      required
                      value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      className="w-full h-11 px-4 bg-transparent border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-sans text-blue-950 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Submission Action Blocks */}
                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setAddAmount("");
                        setAddTitle("");
                        setAddCategory("food");
                        setActiveTab("home");
                      }}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-95 transition-all font-semibold text-xs cursor-pointer"
                    >
                      İptal Et
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 h-11 rounded-xl ${addType === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} text-white font-semibold text-xs active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Değişikliği Kaydet
                    </button>
                  </div>

                </form>

              </motion.div>
            )}

            {/* TAB 4: ANALYTICS & STATS BUDGET PANEL */}
            {activeTab === "analytics" && (
              <motion.div
                key="analytics-panel"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Budget Health Card with slider and progress */}
                <section className="bg-white rounded-2xl shadow-ambient border border-gray-100 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-display font-semibold text-blue-950 text-base">Bütçe Sağlığı Durumu</h3>
                      <p className="text-xs text-gray-400">Mayıs ayı genel tasarruf hedefiniz</p>
                    </div>
                    
                    {/* Inline edit month budget capability */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Hedef Bütçe:</span>
                      <input 
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(Math.max(1, parseFloat(e.target.value) || 0))}
                        className="w-18 h-7 text-xs font-bold bg-[#faf9ff] border border-blue-100 rounded px-1 text-blue-700 font-display text-center outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-blue-700">TL</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">BU AY HARCANAN</span>
                        <span className="font-display font-bold text-xl text-blue-950">
                          ₺{overallSpentThisMonth.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">HEDEF SINIR LİMİTİ</span>
                        <span className="font-display font-bold text-base text-gray-500">
                          ₺{budget.toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking indicator */}
                    {(() => {
                      const pct = Math.min(100, Math.round((overallSpentThisMonth / budget) * 100));
                      const isDanger = pct >= 90;
                      return (
                        <div className="space-y-1.5">
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`absolute top-0 left-0 h-full rounded-full ${
                                isDanger ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-blue-600"
                              }`}
                            />
                          </div>
                          <p className="text-xs text-right text-gray-500">
                            Aylık bütçe kotanızın <span className={`font-bold ${isDanger ? "text-rose-600" : pct >= 70 ? "text-amber-600" : "text-blue-700"}`}>{pct}%</span> lık kısmını kullandınız.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </section>

                {/* Bento layout Grid Trends & Top Categories */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Visual 3-Month Trend Chart Bar (Grid spans 5 cols) */}
                  <section className="md:col-span-5 bg-white rounded-2xl shadow-ambient border border-gray-100 p-5 flex flex-col justify-between h-[360px]">
                    <div>
                      <h3 className="font-display font-semibold text-blue-950 text-base">3 Aylık Eğilim</h3>
                      <p className="text-xs text-gray-400">Oransal harcama dalgalanmaları</p>
                    </div>

                    {/* Highly responsive custom vector bars chart with nice details */}
                    <div className="h-44 flex items-end justify-between gap-4 px-2 mt-4 relative">
                      {/* Grid guideline overlays */}
                      <div className="absolute left-0 right-0 top-0 h-px bg-gray-50 pointer-events-none"></div>
                      <div className="absolute left-0 right-0 top-[25%] h-px bg-gray-50 pointer-events-none"></div>
                      <div className="absolute left-0 right-0 top-[50%] h-px bg-gray-[50%] pointer-events-none"></div>
                      <div className="absolute left-0 right-0 top-[75%] h-px bg-gray-50 pointer-events-none"></div>

                      {/* Bar 1: Oct */}
                      <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-full bg-gray-50 rounded-t-lg relative h-3/4 flex items-end overflow-hidden border border-gray-100/50">
                          <div className="absolute inset-0 bg-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "60%" }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="w-full bg-blue-400 rounded-t-md group-hover:bg-blue-500 transition-colors shadow-sm"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600 transition-colors">Ekim</span>
                      </div>

                      {/* Bar 2: Nov */}
                      <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-full bg-gray-50 rounded-t-lg relative h-3/4 flex items-end overflow-hidden border border-gray-100/50">
                          <div className="absolute inset-0 bg-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "85%" }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full bg-blue-400 rounded-t-md group-hover:bg-blue-300 transition-colors shadow-sm"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-amber-500 transition-colors">Kasım</span>
                      </div>

                      {/* Bar 3: Dec */}
                      <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-full bg-gray-50 rounded-t-lg relative h-3/4 flex items-end overflow-hidden border border-gray-100/50">
                          <div className="absolute inset-0 bg-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "70%" }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="w-full bg-blue-600 rounded-t-md shadow-lg"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600">Aralık</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-400 text-center leading-normal pt-2 border-t border-gray-50">
                      Son 3 ayda en verimli bütçe kontrolü tasarrufu Ekim döneminde kaydedildi.
                    </div>
                  </section>

                  {/* Top Spending Categories List (Grid spans 7 cols) */}
                  <section className="md:col-span-7 bg-white rounded-2xl shadow-ambient border border-gray-100 p-5 space-y-4 h-[360px] flex flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-blue-950 text-base">En Yüksek Kategoriler</h3>
                        <p className="text-xs text-gray-400">Gider dağılımınızın pay grafiği değerleri</p>
                      </div>
                      
                      <span className="text-[10px] font-sans text-gray-400 uppercase tracking-widest font-semibold">
                        Gider Sum
                      </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                      {categoryAggregate.map((catObj) => {
                        const pctOfMax = maxVal > 0 ? (catObj.sum / maxVal) * 100 : 0;
                        return (
                          <div key={catObj.key} className="space-y-1.5 p-1 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-gray-700 font-semibold md:text-sm">
                                <span className={`w-6 h-6 rounded-full ${catObj.color} text-white flex items-center justify-center font-bold text-[10px]`}>
                                  #
                                </span>
                                <span>{catObj.name}</span>
                              </div>
                              <span className="font-display font-bold text-gray-900">
                                ₺{catObj.sum.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctOfMax}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className={`h-full ${catObj.barColor} rounded-full`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </section>

        {/* Right Column / Upcoming & Insights Bento blocks (Grid spans 4 cols on desktop) */}
        <section className="col-span-1 md:col-span-4 space-y-6">
          
          {/* Upcoming Schedules */}
          <section className="bg-white p-5 rounded-2xl shadow-ambient border border-gray-100 space-y-4">
            <h3 className="text-xs font-semibold text-blue-900/60 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" /> Yaklaşan Ödemeler
            </h3>
            
            <div className="space-y-3">
              {upcomingJobs.map((up) => {
                const isUrgent = up.when === "Yarın";
                return (
                  <div 
                    key={up.id} 
                    className={`p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all flex items-center gap-3 relative overflow-hidden group shadow-xs ${
                      isUrgent ? "border-l-4 border-l-red-500" : "border-l-4 border-l-blue-600"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                      isUrgent ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {up.icon === "home" ? "🏠" : "🍿"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-blue-950 truncate">{up.title}</div>
                      <div className={`text-[10px] font-bold ${isUrgent ? "text-red-500" : "text-gray-400"}`}>
                        {up.when}
                      </div>
                    </div>

                    <div className="font-display font-bold text-xs text-blue-950 select-none">
                      ₺{up.amount.toLocaleString("tr-TR")}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => {
                const name = prompt("Yeni yaklaşan ödeme adı:");
                const amountStr = prompt("Tutar (₺):");
                const when = prompt("Ne zaman? (Örn: Haftaya, 5 gün sonra):");
                if (name && amountStr && when && !isNaN(parseFloat(amountStr))) {
                  setUpcomingJobs(prev => [
                    ...prev,
                    {
                      id: "up-" + Date.now(),
                      title: name,
                      amount: parseFloat(amountStr),
                      when: when,
                      category: "other",
                      icon: "home"
                    }
                  ]);
                }
              }}
              className="w-full py-2 bg-[#faf9ff] hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl text-center text-xs font-semibold text-blue-600 transition-all cursor-pointer block active:scale-95 duration-100"
            >
              + Yaklaşan Plan Ödemesi Ekle
            </button>
          </section>

          {/* Quick Stats Summary mini Widget */}
          <section className="bg-[#faf9ff] p-4 rounded-2xl border border-blue-50/50 space-y-4 shadow-xs">
            <h3 className="text-xs font-semibold text-blue-900/60 uppercase tracking-widest flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-500" /> Hızlı Bilgi Filtreleme
            </h3>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", name: "Hepsi" },
                  { key: "food", name: "🍔 Yemek" },
                  { key: "transport", name: "🚗 Ulaşım" },
                  { key: "shopping", name: "🛒 Alışveriş" },
                  { key: "utilities", name: "🏢 Faturalar" }
                ].map((chip) => {
                  const isActive = homeFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => {
                        setHomeFilter(chip.key);
                        setActiveTab("home");
                      }}
                      className={`px-3 py-1.5 rounded-full font-medium text-[10px] transition-colors cursor-pointer select-none active:scale-95 duration-100 ${
                        isActive
                          ? "bg-blue-600 text-white shadow"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {chip.name}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-100 text-[11px] text-gray-500 leading-normal flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Yukarıdaki hızlı filtreleri kullanarak ana ekran takvim işlemlerinizi süzebilir, alt gezinti çubuğundan ise asistanla konuşabilirsiniz.
                </span>
              </div>
            </div>
          </section>

          {/* AI Quick Banner Call-out widget */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl flex flex-col justify-between items-start gap-3 h-40 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-100/50 px-2 py-0.5 rounded-full">
                Yapay Zeka Destekli
              </span>
              <h4 className="font-semibold text-xs text-blue-950">Gemini ile Gider Analizi</h4>
              <p className="text-[10px] text-gray-500 leading-normal">
                Fatura harcamalarınızın kümülatif eğilimini grafiklerle inceleyin, asistanın bütçe kotalarınızı ayarlamasını isteyin.
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab("assistant")}
              className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 duration-100 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              Asistanla Konuş <ChevronRight className="w-3 h-3" />
            </button>
          </div>

        </section>

      </main>

      {/* Floating Action Button (FAB) at bottom-right pointing to add tab */}
      <button
        onClick={() => setActiveTab("add")}
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/35 flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-30 group"
        title="Yeni Harcama Kaydı Ekle"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300 pointer-events-none" />
      </button>

      {/* Persistent Static Mobile Navigation Bar (visible bottom, hidden on larger screens) */}
      <nav className="sticky bottom-0 left-0 right-0 w-full z-40 bg-white shadow-[0_-4px_12px_rgba(9,30,66,0.08)] border-t border-gray-100 md:hidden pb-safe">
        <div className="flex justify-around items-center w-full px-4 py-2.5 max-w-lg mx-auto">
          
          <button
            onClick={() => {
              setActiveTab("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-200 active:scale-90 rounded-xl cursor-pointer ${
              activeTab === "home"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Panel</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("assistant");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-200 active:scale-90 rounded-xl cursor-pointer ${
              activeTab === "assistant"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Asistan</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("add");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-200 active:scale-90 rounded-xl cursor-pointer ${
              activeTab === "add"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Ekle</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-200 active:scale-90 rounded-xl cursor-pointer ${
              activeTab === "analytics"
                ? "bg-blue-50 text-blue-600 font-bold"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Analiz</span>
          </button>

        </div>
      </nav>

      {/* Desktop Responsive Tab Navigation Cluster shown at bottom screen on large device */}
      <footer className="hidden md:block w-full text-center py-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center text-xs text-gray-400">
          <p>© 2026 Para Takip. Tüm Hakları Saklıdır.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab("home")} 
              className={`hover:text-blue-600 transition-colors font-medium ${activeTab === "home" ? "text-blue-600 font-bold" : ""}`}
            >
              Ana Panel
            </button>
            <button 
              onClick={() => setActiveTab("assistant")} 
              className={`hover:text-blue-600 transition-colors font-medium ${activeTab === "assistant" ? "text-blue-600 font-bold" : ""}`}
            >
              AI Asistanı
            </button>
            <button 
              onClick={() => setActiveTab("add")} 
              className={`hover:text-blue-600 transition-colors font-medium ${activeTab === "add" ? "text-blue-600 font-bold" : ""}`}
            >
              Fiş Tara
            </button>
            <button 
              onClick={() => setActiveTab("analytics")} 
              className={`hover:text-blue-600 transition-colors font-medium ${activeTab === "analytics" ? "text-blue-600 font-bold" : ""}`}
            >
              Analizler
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
