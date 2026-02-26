import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from './lib/firebase';
import { onAuthStateChanged, updateProfile, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import {
  Camera, Users, UserPlus, MessageSquare, ChevronLeft, X, Send, Gem, Sparkles, Trophy,
  Gamepad2, PlayCircle, Lock, Star, VideoOff, Settings, LogOut, UserCircle, Edit2,
  Heart, MessageCircle, Share2, Mic, MicOff, Volume2, Gift, Crown, ShoppingBag, Medal,
  ArrowLeft, Bell, MoreHorizontal, Bookmark, Radio, Dices, Shield, Globe, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CATÁLOGO DE ANIMACIONES ---
const ANIMATIONS_CATALOG = [
  { id: 'rose', icon: '🌹', name: 'Rosa', price: 10, xp: 5 },
  { id: 'fire', icon: '🔥', name: 'Fuego', price: 50, xp: 25 },
  { id: 'heart_bomb', icon: '💣❤️', name: 'Bomba Amor', price: 200, xp: 100 },
  { id: 'crown', icon: '👑', name: 'Corona', price: 500, xp: 250 },
  { id: 'rocket', icon: '🚀', name: 'Cohete', price: 1000, xp: 500 }
];

const FlyingAnimation = ({ icon, onComplete }) => (
  <motion.div
    initial={{ scale: 0, y: 0, opacity: 1 }}
    animate={{ scale: [1, 3, 2], y: -400, opacity: [1, 1, 0] }}
    transition={{ duration: 2 }}
    onAnimationComplete={onComplete}
    style={{ position: 'absolute', fontSize: '60px', zIndex: 9999, pointerEvents: 'none' }}
  >
    {icon}
  </motion.div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ level: 1, xp: 0, diamonds: 2500, photoURL: '', name: 'Usuario' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [inGroupCall, setInGroupCall] = useState(false);
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifList, setShowNotifList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [pinInput, setPinInput] = useState('');

  const ADMIN_EMAIL = 'votija03051996@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          const initialData = { level: 1, xp: 0, diamonds: 2500, name: currentUser.displayName || "Amigo Puz", photoURL: '' };
          await setDoc(userDoc, initialData);
          setUserData(initialData);
        }
        onSnapshot(query(collection(db, "profiles", currentUser.uid, "notifications"), orderBy("createdAt", "desc"), limit(10)), (snap) => {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else { setUser(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleReceiveGift = async (animXp) => {
    const userDoc = doc(db, "profiles", user.uid);
    let newXp = userData.xp + animXp;
    let newLevel = userData.level;
    if (newXp >= userData.level * 1000) { newLevel += 1; newXp = 0; }
    await updateDoc(userDoc, { xp: newXp, level: newLevel });
    setUserData(prev => ({ ...prev, xp: newXp, level: newLevel }));
  };

  const handleEnterRoom = (name) => {
    setSelectedRoomName(name);
    setInGroupCall(true);
  };

  const handleAdminAccess = () => {
    if (user?.email === ADMIN_EMAIL) {
      setShowAdminPin(true);
    }
  };

  const checkPin = () => {
    if (pinInput === "199676") {
      setIsAdmin(true);
      setActiveTab('admin');
      setShowAdminPin(false);
      setPinInput('');
    } else {
      alert("PIN INCORRECTO");
      setPinInput('');
    }
  };

  if (loading) return <div className="container center"><div className="avatar-pulse">AMIGOS PUZ...</div></div>;
  if (!user) return <Login />;

  return (
    <div className="container">
      <header className="main-header">
        <div className="app-title" onClick={handleAdminAccess} style={{cursor: user.email === ADMIN_EMAIL ? 'pointer' : 'default'}}>AMIGOS PUZ</div>
        <div className="header-actions" style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div className="diamond-badge-header"><Gem size={14} color="#f1c40f" /><span>{userData.diamonds}</span></div>
          <div style={{display:'flex', gap:'8px', background:'rgba(255,255,255,0.05)', padding:'4px', borderRadius:'12px'}}>
            <button className="notif-btn" onClick={() => setShowNotifList(!showNotifList)} style={{minHeight:'auto', padding:'8px'}}>
              <Bell size={20} />
              {notifications.length > 0 && <span className="notif-dot"></span>}
            </button>
            <button className="notif-btn" onClick={() => setShowSettings(true)} style={{minHeight:'auto', padding:'8px'}}>
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {showNotifList ? (
            <NotificationPanel key="notifs" list={notifications} onBack={() => setShowNotifList(false)} />
          ) : inGroupCall ? (
            <GroupMeetingUI onExit={() => setInGroupCall(false)} userData={userData} onReceiveGift={handleReceiveGift} roomName={selectedRoomName} isAdmin={user.email === ADMIN_EMAIL} />
          ) : (
            <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} style={{ height: '100%' }}>
              {activeTab === 'feed' && <FeedModule user={user} userData={userData} onEnterRoom={() => handleEnterRoom("Mi Sala VIP 🚀")} />}
              {activeTab === 'store' && <StoreModule userData={userData} setUserData={setUserData} />}
              {activeTab === 'rooms' && <RoomsModule onEnterRoom={handleEnterRoom} />}
              {isAdmin && activeTab === 'admin' && <AdminPanel onBack={() => setActiveTab('feed')} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAdminPin && (
          <div className="modal-overlay">
            <div className="card modal-card">
              <h3>MODO ADMINISTRADOR</h3>
              <input type="password" inputMode="numeric" placeholder="Introduce el PIN" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus style={{textAlign:'center', fontSize:24, letterSpacing:10}} />
              <div style={{display:'flex', gap:10, marginTop:20}}>
                <button className="secondary-btn" onClick={() => setShowAdminPin(false)}>X</button>
                <button className="primary-btn" onClick={checkPin} style={{flex:1}}>ENTRAR</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <div className="modal-overlay">
            <motion.div initial={{y: 100}} animate={{y: 0}} className="card modal-card" style={{maxWidth: '380px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems:'center' }}>
                <h3>AJUSTES</h3>
                <button onClick={() => setShowSettings(false)} className="back-btn-small"><X size={24}/></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="secondary-btn" style={{justifyContent: 'flex-start', height:'50px'}}><Edit2 size={18} style={{marginRight:10}}/> Perfil</button>
                <button className="secondary-btn" style={{justifyContent: 'flex-start', height:'50px'}}><Shield size={18} style={{marginRight:10}}/> Seguridad</button>
                <button className="secondary-btn" style={{justifyContent: 'flex-start', height:'50px'}}><Globe size={18} style={{marginRight:10}}/> Idioma</button>
                <button className="secondary-btn" style={{justifyContent: 'center', color: 'var(--error)', height:'55px', border:'1px solid var(--error)', marginTop:15}} onClick={() => signOut(auth)}>
                  <LogOut size={18} style={{marginRight:10}}/> SALIR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!inGroupCall && !showNotifList && (
        <nav className="bottom-nav">
          <NavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<MessageSquare />} label="Muro" />
          <NavButton active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} icon={<Users />} label="Salas" />
          <NavButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<ShoppingBag />} label="Tienda" />
          {isAdmin && <NavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Lock />} label="Admin" />}
        </nav>
      )}
    </div>
  );
};

const GroupMeetingUI = ({ onExit, userData, onReceiveGift, roomName, isAdmin }) => {
  const [flying, setFlying] = useState([]);
  const [selSeat, setSelSeat] = useState(null);

  const sendGift = async (a) => {
    // LLAVE MAESTRA: Si es admin, no se cobra.
    if (!isAdmin) {
      if (userData.diamonds < a.price) { alert("Sin diamantes"); return; }
      const userDoc = doc(db, "profiles", auth.currentUser.uid);
      await updateDoc(userDoc, { diamonds: userData.diamonds - a.price });
    }
    setFlying([...flying, { id: Date.now(), icon: a.icon, seat: selSeat }]);
    if (selSeat === 0) onReceiveGift(a.xp);
    setSelSeat(null);
  };

  return (
    <div className="meeting-overlay">
      <header className="meeting-header"><button onClick={onExit} className="back-btn-small"><ArrowLeft/></button><span>{roomName?.toUpperCase()}</span><div style={{width:24}}></div></header>
      <div className="meeting-grid-8" style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:20, padding:20}}>{[...Array(8)].map((_, i) => (
          <div key={i} className="meeting-seat" onClick={() => i!==0 && setSelSeat(i)} style={{textAlign:'center'}}><div className="seat-avatar" style={{width:75, height:75, borderRadius:'50%', background: i===0?'var(--primary)':'#222', margin:'0 auto', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', border: '2px solid rgba(255,255,255,0.1)'}}>{i===0 ? (userData.photoURL ? <img src={userData.photoURL} style={{width:'100%', height:'100%', borderRadius:'50%'}} /> : userData.name[0]) : <UserPlus opacity={0.2}/>}<AnimatePresence>{flying.filter(f => f.seat === i).map(f => <FlyingAnimation key={f.id} icon={f.icon} onComplete={() => setFlying(prev => prev.filter(p => p.id !== f.id))} />)}</AnimatePresence></div><span style={{fontSize:10, marginTop: '5px', display:'block'}}>{i===0?'Tú':'Asiento '+ (i+1)}</span></div>
        ))}</div>
      {selSeat && (
        <div className="gift-picker" style={{position:'absolute', bottom:0, background:'#1a1a1a', width:'100%', padding:20, borderRadius:'25px 25px 0 0', borderTop: '2px solid var(--primary)'}}><h4 style={{marginBottom:15}}>Regalar {isAdmin && "(GRATIS ADMIN)"}</h4><div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>{ANIMATIONS_CATALOG.map(a => <button key={a.id} onClick={() => sendGift(a)} style={{background:'#252525', border:'1px solid #333', color:'white', padding:10, borderRadius:15}}><div style={{fontSize:24}}>{a.icon}</div><div style={{fontSize:10, fontWeight:'bold', color:'var(--primary)'}}>{isAdmin ? "FREE" : a.price + " 💎"}</div></button>)}</div><button onClick={() => setSelSeat(null)} className="secondary-btn" style={{width:'100%', marginTop:15}}>Cerrar</button></div>
      )}
      <div style={{padding:20, position:'absolute', bottom:20, width:'100%', display:'flex', gap:15}}><button className="secondary-btn" style={{flex:1}}><Mic /></button><button className="primary-btn" onClick={onExit} style={{flex:2, background:'#e74c3c'}}>SALIR</button></div>
    </div>
  );
};

const AdminPanel = ({ onBack }) => (
  <div className="fade-in" style={{padding:20}}>
    <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:30}}>
      <button onClick={onBack} className="back-btn-small"><ChevronLeft/></button>
      <h2>PANEL DE CONTROL</h2>
    </div>
    <div className="card" style={{border:'1px solid gold'}}>
      <p>Bienvenido, Administrador Principal.</p>
      <div style={{marginTop:20, display:'flex', flexDirection:'column', gap:10}}>
        <button className="primary-btn">Gestionar Usuarios</button>
        <button className="primary-btn" style={{background:'#3498db'}}>Ver Reportes</button>
        <button className="primary-btn" style={{background:'#2ecc71'}}>Añadir Diamantes Globales</button>
      </div>
    </div>
  </div>
);

// ... (FeedModule, StoreModule, NotificationPanel, NavButton, Login se mantienen iguales)

const FeedModule = ({ user, userData, onEnterRoom }) => {
  const [topUsers, setTopUsers] = useState([]);
  useEffect(() => {
    onSnapshot(query(collection(db, "profiles"), orderBy("level", "desc"), limit(5)), (snap) => {
      setTopUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);
  return (
    <div className="fade-in">
      <div className="card profile-header-ig" style={{borderBottom:'1px solid rgba(255,255,255,0.05)', borderRadius:0}}><div className="profile-top"><div className="avatar-wrapper" style={{width:80, height:80}}>{userData.photoURL ? <img src={userData.photoURL} className="avatar-img" /> : <div className="avatar-placeholder" style={{fontSize:30}}>{userData.name[0]}</div>}</div><div className="profile-stats"><div className="stat-item"><b>{userData.level}</b><span>Nivel</span></div><div className="stat-item"><b>1.2k</b><span>Fans</span></div><div className="stat-item"><b>450</b><span>Siguiendo</span></div></div></div><div className="profile-bio"><div className="user-name-ig">{userData.name}</div><p>¡Disfrutando de AMIGOS PUZ! 🚀</p></div><button onClick={onEnterRoom} className="live-btn-ig" style={{background:'linear-gradient(45deg, var(--primary), #e67e22)'}}>TRANSMITIR EN VIVO 🎙️</button></div>
      <div className="ranking-section" style={{padding:'15px'}}><div className="section-title" style={{marginBottom:15, display:'flex', alignItems:'center', gap:10}}><Medal size={18} color="var(--primary)"/> <b>TOP RANKING REAL</b></div><div className="card ranking-card" style={{padding:0, overflow:'hidden'}}>{topUsers.map((u, i) => (<div key={u.id} className="ranking-item" style={{padding:'12px 15px', background: i===0 ? 'rgba(243, 156, 18, 0.05)' : 'transparent', borderBottom:'1px solid rgba(255,255,255,0.02)'}}><span style={{fontWeight:'bold', color: i===0 ? 'gold' : 'white', width:25}}>#{i+1}</span><div className="avatar-mini" style={{border: i===0 ? '1px solid gold' : 'none'}}>{u.photoURL ? <img src={u.photoURL} /> : u.name[0]}</div><span style={{flex:1, fontSize:13, fontWeight: i===0?'bold':'normal'}}>{u.name}</span><span className="rank-lvl" style={{background: i===0?'gold':'var(--primary)', color: i===0?'black':'white'}}>LVL {u.level}</span></div>))}</div></div>
    </div>
  );
};

const StoreModule = ({ userData, setUserData }) => (
  <div className="fade-in" style={{padding:15}}><div className="card reward-hero" style={{border:'2px solid var(--primary)', marginBottom:20}}><div className="shield-container"><div className="shield-inner"><Gamepad2 size={40}/><div style={{fontSize:10, fontWeight:900}}>GANA PLAY</div></div></div><h2>Diamantes: {userData.diamonds}</h2><button className="primary-btn reward-btn" onClick={async () => {
        const newD = userData.diamonds + 100;
        await updateDoc(doc(db, "profiles", auth.currentUser.uid), { diamonds: newD });
        setUserData(prev => ({...prev, diamonds: newD}));
      }}><PlayCircle size={24}/> VER VIDEO +100 💎</button></div><div className="pack-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>{ANIMATIONS_CATALOG.map(a => (<div key={a.id} className="card pack-card" style={{textAlign:'center'}}><div style={{fontSize:30}}>{a.icon}</div><div style={{fontSize:10}}>{a.name}</div><div style={{color:'var(--primary)', fontWeight:'bold'}}>{a.price} 💎</div></div>))}</div></div>
);

const RoomsModule = ({ onEnterRoom }) => {
  const activeRooms = [{ id: 1, name: "Fiesta 🎉", users: 5 }, { id: 2, name: "Karaoke 🎤", users: 8 }, { id: 3, name: "Charla ☕", users: 3 }];
  return (<div className="fade-in" style={{padding: '15px'}}><h3 style={{marginBottom: '20px'}}>SALAS EN VIVO</h3><button onClick={() => onEnterRoom("Sala Sorpresa 🎲")} className="primary-btn" style={{ width: '100%', height: '60px', borderRadius: '15px', marginBottom: '20px', background: 'linear-gradient(45deg, #f39c12, #e74c3c)' }}>¡SORPRÉNDEME! 🎲</button><div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>{activeRooms.map(room => (<div key={room.id} onClick={() => onEnterRoom(room.name)} className="card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px'}}><div><b>{room.name}</b><br/><span style={{fontSize:'12px', opacity:0.5}}>{room.users}/8 personas</span></div><ChevronLeft style={{transform: 'rotate(180deg)'}} size={20} opacity={0.3}/></div>))}</div></div>);
};

const NotificationPanel = ({ list, onBack }) => (
  <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="notif-panel"><div className="notif-header"><button onClick={onBack} className="back-btn-small"><ChevronLeft/></button><h3>Avisos</h3><div style={{width:24}}></div></div><div className="notif-list" style={{padding:15}}>{list.length === 0 ? <div style={{textAlign:'center', opacity:0.3, marginTop:50}}><Bell size={40}/><p>Nada nuevo</p></div> : list.map(n => <div key={n.id} style={{padding:15, borderBottom:'1px solid #333', display:'flex', gap:10}}><span>🎁</span><p>{n.message}</p></div>)}</div></motion.div>
);

const NavButton = ({ active, onClick, icon, label }) => (<button onClick={onClick} className={`nav-item-ig ${active ? 'active' : ''}`}>{icon}<span>{label}</span></button>);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isReg, setIsReg] = useState(false);
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isReg) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { alert(err.message); }
  };
  return (<div className="container center" style={{background: 'linear-gradient(135deg, #4d1d12, #6b3b00)'}}><div className="card login-box" style={{textAlign: 'center', padding: '40px 30px'}}><div className="login-logo-circle"><Sparkles color="white" size={40} /></div><h1 style={{fontSize: '28px', fontWeight: '900', marginBottom: '30px'}}>AMIGOS PUZ</h1><form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}><input type="email" placeholder="Email" className="login-input" onChange={e => setEmail(e.target.value)} required /><input type="password" placeholder="Pass" className="login-input" onChange={e => setPassword(e.target.value)} required /><button type="submit" className="primary-btn" style={{height: '55px', borderRadius: '15px'}}>{isReg ? 'REGISTRARSE' : 'ENTRAR'}</button></form><button onClick={() => setIsReg(!isReg)} className="text-link-btn">{isReg ? 'Ya tengo cuenta' : 'Crear cuenta gratis'}</button><div className="separator"><span>o</span></div><button className="secondary-btn" onClick={() => signInAnonymously(auth)} style={{width: '100%', height: '50px', borderRadius: '15px'}}>ENTRAR COMO INVITADO</button></div></div>);
};

export default App;
