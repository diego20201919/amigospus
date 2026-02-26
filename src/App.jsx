import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from './lib/firebase';
import { onAuthStateChanged, updateProfile, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import {
  Camera, Users, UserPlus, MessageSquare, ChevronLeft, X, Send, Gem, Sparkles, Trophy,
  Gamepad2, PlayCircle, Lock, Star, VideoOff, Settings, LogOut, UserCircle, Edit2,
  Heart, MessageCircle, Share2, Mic, MicOff, Volume2, Gift, Crown, ShoppingBag, Medal,
  ArrowLeft, Bell, MoreHorizontal, Bookmark
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
  const [notifications, setNotifications] = useState([]);
  const [showNotifList, setShowNotifList] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          const initialData = { level: 1, xp: 0, diamonds: 2500, name: currentUser.displayName || "Amigo Puz", photoURL: currentUser.photoURL || '' };
          await setDoc(userDoc, initialData);
          setUserData(initialData);
        }
        // Listener Notificaciones
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "profiles", user.uid), { photoURL: url });
      setUserData(prev => ({ ...prev, photoURL: url }));
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  if (loading) return <div className="container center"><div className="avatar-pulse">AMIGOS PUZ...</div></div>;
  if (!user) return <Login />;

  return (
    <div className="container">
      <header className="main-header">
        <div className="app-title">AMIGOS PUZ</div>
        <div className="header-actions">
          <div className="diamond-badge-header"><Gem size={14} color="#f1c40f" /><span>{userData.diamonds}</span></div>
          <button className="notif-btn" onClick={() => setShowNotifList(!showNotifList)}>
            <Bell size={20} />
            {notifications.length > 0 && <span className="notif-dot"></span>}
          </button>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {showNotifList ? (
            <NotificationPanel key="notifs" list={notifications} onBack={() => setShowNotifList(false)} />
          ) : inGroupCall ? (
            <GroupMeetingUI onExit={() => setInGroupCall(false)} userData={userData} onReceiveGift={handleReceiveGift} />
          ) : (
            <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} style={{ height: '100%' }}>
              {activeTab === 'feed' && <FeedModule user={user} userData={userData} onEnterRoom={() => setInGroupCall(true)} onUpload={handlePhotoUpload} uploading={uploading} />}
              {activeTab === 'store' && <StoreModule userData={userData} setUserData={setUserData} />}
              {activeTab === 'camera' && <CameraModule />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!inGroupCall && !showNotifList && (
        <nav className="bottom-nav">
          <NavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<MessageSquare />} label="Muro" />
          <NavButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<ShoppingBag />} label="Tienda" />
          <NavButton active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} icon={<Camera />} label="Cámara" />
        </nav>
      )}
    </div>
  );
};

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
  return (
    <div className="container center" style={{background: 'linear-gradient(135deg, #4d1d12, #6b3b00)'}}>
      <div className="card login-box" style={{textAlign: 'center', padding: '40px 30px'}}>
        <div className="login-logo-circle"><Sparkles color="white" size={40} /></div>
        <h1 style={{fontSize: '28px', fontWeight: '900', marginBottom: '30px'}}>AMIGOS PUZ</h1>
        <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <input type="email" placeholder="Email" className="login-input" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Pass" className="login-input" onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="primary-btn" style={{height: '55px', borderRadius: '15px'}}>{isReg ? 'REGISTRARSE' : 'ENTRAR'}</button>
        </form>
        <button onClick={() => setIsReg(!isReg)} className="text-link-btn">{isReg ? 'Ya tengo cuenta' : 'Crear cuenta gratis'}</button>
        <div className="separator"><span>o</span></div>
        <button className="secondary-btn" onClick={() => signInAnonymously(auth)} style={{width: '100%', height: '50px', borderRadius: '15px'}}>ENTRAR COMO INVITADO</button>
      </div>
    </div>
  );
};

const FeedModule = ({ user, userData, onEnterRoom, onUpload, uploading }) => {
  const [topUsers, setTopUsers] = useState([]);
  useEffect(() => {
    onSnapshot(query(collection(db, "profiles"), orderBy("level", "desc"), limit(5)), (snap) => {
      setTopUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <div className="fade-in">
      <div className="card profile-header-ig">
        <div className="profile-top">
          <div className="avatar-wrapper" style={{width:80, height:80}}>
            {userData.photoURL ? <img src={userData.photoURL} className="avatar-img" /> : <div className="avatar-placeholder" style={{fontSize:30}}>{userData.name[0]}</div>}
            <label className="edit-overlay"><input type="file" onChange={onUpload} hidden accept="image/*" /><Camera size={12} color="white" /></label>
            {uploading && <div className="mini-loader"></div>}
          </div>
          <div className="profile-stats">
            <div className="stat-item"><b>{userData.level}</b><span>Nivel</span></div>
            <div className="stat-item"><b>1.2k</b><span>Fans</span></div>
            <div className="stat-item"><b>450</b><span>Siguiendo</span></div>
          </div>
        </div>
        <div className="profile-bio"><div className="user-name-ig">{userData.name}</div><p>¡Disfrutando de AMIGOS PUZ! 🚀</p></div>
        <button onClick={onEnterRoom} className="live-btn-ig">TRANSMITIR EN VIVO 🎙️</button>
      </div>

      <div className="ranking-section" style={{padding:'0 15px'}}>
        <div className="section-title" style={{marginBottom:10}}><Medal size={16} color="var(--primary)"/> TOP RANKING REAL</div>
        <div className="card ranking-card">
          {topUsers.map((u, i) => (
            <div key={u.id} className="ranking-item">
              <span style={{fontWeight:'bold', color: i===0 ? 'gold' : 'white'}}>#{i+1}</span>
              <div className="avatar-mini">{u.photoURL ? <img src={u.photoURL} /> : u.name[0]}</div>
              <span style={{flex:1, fontSize:13}}>{u.name}</span>
              <span className="rank-lvl">LVL {u.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StoreModule = ({ userData, setUserData }) => (
  <div className="fade-in" style={{padding:15}}>
    <div className="card reward-hero" style={{border:'2px solid var(--primary)', marginBottom:20}}>
      <div className="shield-container"><div className="shield-inner"><Gamepad2 size={40}/><div style={{fontSize:10, fontWeight:900}}>GANA PLAY</div></div></div>
      <h2>Diamantes: {userData.diamonds}</h2>
      <button className="primary-btn reward-btn" onClick={async () => {
        const newD = userData.diamonds + 100;
        await updateDoc(doc(db, "profiles", auth.currentUser.uid), { diamonds: newD });
        setUserData(prev => ({...prev, diamonds: newD}));
      }}><PlayCircle size={24}/> VER VIDEO +100 💎</button>
    </div>
    <h3>Catálogo de Animaciones</h3>
    <div className="pack-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:15}}>
      {ANIMATIONS_CATALOG.map(a => (
        <div key={a.id} className="card pack-card" style={{textAlign:'center'}}>
          <div style={{fontSize:40}}>{a.icon}</div>
          <div style={{fontWeight:'bold', fontSize:12}}>{a.name}</div>
          <div style={{color:'var(--primary)', fontWeight:'bold'}}>{a.price} 💎</div>
        </div>
      ))}
    </div>
  </div>
);

const GroupMeetingUI = ({ onExit, userData, onReceiveGift }) => {
  const [flying, setFlying] = useState([]);
  const [selSeat, setSelSeat] = useState(null);
  const sendGift = (a) => {
    setFlying([...flying, { id: Date.now(), icon: a.icon, seat: selSeat }]);
    if (selSeat === 0) onReceiveGift(a.xp);
    setSelSeat(null);
  };
  return (
    <div className="meeting-overlay">
      <header className="meeting-header"><button onClick={onExit} className="back-btn-small"><ArrowLeft/></button><span>SALA VIP</span></header>
      <div className="meeting-grid-8" style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:20, padding:20}}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="meeting-seat" onClick={() => i!==0 && setSelSeat(i)} style={{textAlign:'center'}}>
            <div className="seat-avatar" style={{width:70, height:70, borderRadius:'50%', background: i===0?'var(--primary)':'#333', margin:'0 auto', position:'relative', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {i===0 ? (userData.photoURL ? <img src={userData.photoURL} style={{width:'100%', height:'100%', borderRadius:'50%'}} /> : userData.name[0]) : <UserPlus opacity={0.2}/>}
              {flying.filter(f => f.seat === i).map(f => <FlyingAnimation key={f.id} icon={f.icon} onComplete={() => setFlying(prev => prev.filter(p => p.id !== f.id))} />)}
            </div>
            <span style={{fontSize:10}}>{i===0?'Tú':'Asiento'}</span>
          </div>
        ))}
      </div>
      {selSeat && (
        <div className="gift-picker" style={{position:'absolute', bottom:0, background:'#1a1a1a', width:'100%', padding:20, borderRadius:'20px 20px 0 0'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
            {ANIMATIONS_CATALOG.map(a => <button key={a.id} onClick={() => sendGift(a)} style={{background:'#333', border:'none', color:'white', padding:10, borderRadius:10}}>
              <div>{a.icon}</div><div style={{fontSize:10}}>{a.price} 💎</div>
            </button>)}
          </div>
          <button onClick={() => setSelSeat(null)} className="secondary-btn" style={{width:'100%', marginTop:10}}>Cerrar</button>
        </div>
      )}
      <button className="primary-btn" onClick={onExit} style={{position:'absolute', bottom:40, left:20, right:20, background:'#e74c3c'}}>SALIR</button>
    </div>
  );
};

const NotificationPanel = ({ list, onBack }) => (
  <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="notif-panel">
    <div className="notif-header"><button onClick={onBack} className="back-btn-small"><ChevronLeft/></button><h3>Avisos</h3><div style={{width:24}}></div></div>
    <div className="notif-list" style={{padding:15}}>
      {list.length === 0 ? <div style={{textAlign:'center', opacity:0.3, marginTop:50}}><Bell size={40}/><p>Nada nuevo</p></div> :
        list.map(n => <div key={n.id} style={{padding:15, borderBottom:'1px solid #333', display:'flex', gap:10}}><span>🎁</span><p>{n.message}</p></div>)
      }
    </div>
  </motion.div>
);

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`nav-item-ig ${active ? 'active' : ''}`}>{icon}<span>{label}</span></button>
);

const CameraModule = () => (<div className="card center" style={{height:300, background:'#000', margin:20}}><h3>Cámara Lista</h3></div>);

export default App;
