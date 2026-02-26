import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from './lib/firebase';
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Camera, Users, UserPlus, MessageSquare, ChevronLeft, X, Send, Gem, Sparkles, Trophy,
  Gamepad2, PlayCircle, Lock, Star, VideoOff, Settings, LogOut, UserCircle, Edit2,
  Heart, MessageCircle, Share2, Mic, MicOff, Volume2, Gift, Crown, ShoppingBag, Medal,
  ArrowLeft, Bell, MoreHorizontal, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ level: 1, xp: 0, diamonds: 2500, photoURL: '', name: 'Usuario' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [inGroupCall, setInGroupCall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifList, setShowNotifNotifList] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          const initialData = { level: 1, xp: 0, diamonds: 2500, name: currentUser.displayName || "Nuevo Amigo", photoURL: '' };
          await setDoc(userDoc, initialData);
          setUserData(initialData);
        }

        // Listener de Notificaciones Reales
        const notifQ = query(collection(db, "profiles", currentUser.uid, "notifications"), orderBy("createdAt", "desc"), limit(10));
        onSnapshot(notifQ, (snap) => {
          setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

      } else { setUser(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="container center"><div className="avatar-pulse">Conectando...</div></div>;
  if (!user) return <Login />;

  return (
    <div className="container">
      <header className="main-header">
        <div className="app-title">AMIGOS PUZ</div>
        <div className="header-actions">
          <div className="diamond-badge-header">
            <Gem size={14} color="#f1c40f" />
            <span>{userData.diamonds}</span>
          </div>
          <button className="notif-btn" onClick={() => setShowNotifNotifList(!showNotifList)}>
            <Bell size={20} />
            {notifications.length > 0 && <span className="notif-dot"></span>}
          </button>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {showNotifList ? (
            <NotificationPanel key="notifs" list={notifications} onBack={() => setShowNotifNotifList(false)} />
          ) : inGroupCall ? (
            <GroupMeetingUI onExit={() => setInGroupCall(false)} userData={userData} />
          ) : (
            <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} style={{ height: '100%' }}>
              {activeTab === 'feed' && <FeedModule user={user} userData={userData} onEnterRoom={() => setInGroupCall(true)} />}
              {activeTab === 'store' && <StoreModule userData={userData} />}
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

// --- MURO ESTILO INSTAGRAM ---
const FeedModule = ({ user, userData, onEnterRoom }) => {
  const posts = [
    { id: 1, user: 'Elena_Puz', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', content: '¡Feliz día a todos en AMIGOS PUZ! 🌟', likes: 124, img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500' },
    { id: 2, user: 'Carlos_Dev', photo: '', content: 'Buscando amigos para sala de música 🎸', likes: 89, img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500' }
  ];

  return (
    <div className="fade-in">
      <div className="card profile-header-ig">
        <div className="profile-top">
          <div className="avatar-main">
            {userData.photoURL ? <img src={userData.photoURL} alt="p" /> : <UserCircle size={60} />}
          </div>
          <div className="profile-stats">
            <div className="stat-item"><b>{userData.level}</b><span>Nivel</span></div>
            <div className="stat-item"><b>1.2k</b><span>Seguidores</span></div>
            <div className="stat-item"><b>450</b><span>Siguiendo</span></div>
          </div>
        </div>
        <div className="profile-bio">
          <div className="user-name-ig">{userData.name}</div>
          <p>Disfrutando de la mejor comunidad 🚀</p>
        </div>
        <button onClick={onEnterRoom} className="live-btn-ig">TRANSMITIR EN VIVO 🎙️</button>
      </div>

      <div className="ig-feed">
        {posts.map(post => (
          <div key={post.id} className="ig-post">
            <div className="post-header">
              <div className="post-user">
                <div className="avatar-tiny">{post.photo ? <img src={post.photo} /> : post.user[0]}</div>
                <span>{post.user}</span>
              </div>
              <MoreHorizontal size={18} />
            </div>
            <div className="post-image">
              <img src={post.img} alt="post" />
            </div>
            <div className="post-actions">
              <div className="left-actions">
                <Heart size={24} className="action-icon" />
                <MessageCircle size={24} className="action-icon" />
                <Share2 size={24} className="action-icon" />
              </div>
              <Bookmark size={24} />
            </div>
            <div className="post-info">
              <div className="likes-count">{post.likes} Me gusta</div>
              <div className="post-caption"><b>{post.user}</b> {post.content}</div>
              <div className="post-time">Hace 2 horas</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PANEL DE NOTIFICACIONES ---
const NotificationPanel = ({ list, onBack }) => (
  <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="notif-panel">
    <div className="notif-header">
      <button onClick={onBack} className="back-btn-small"><ChevronLeft /></button>
      <h3>Notificaciones</h3>
      <div style={{width:24}}></div>
    </div>
    <div className="notif-list">
      {list.length === 0 ? (
        <div className="empty-notif">
          <Bell size={40} opacity={0.2} />
          <p>No tienes avisos nuevos</p>
        </div>
      ) : (
        list.map(n => (
          <div key={n.id} className="notif-item">
            <div className="notif-icon">{n.type === 'gift' ? '🎁' : '⭐'}</div>
            <div className="notif-text">
              <p>{n.message}</p>
              <span>{new Date(n.createdAt?.toDate()).toLocaleTimeString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

// --- LOS DEMÁS COMPONENTES (Store, Meeting, etc) SIGUEN IGUAL PARA ESTABILIDAD ---
const StoreModule = ({ userData }) => (
  <div className="card"><h3>Tienda VIP</h3><p>Diamantes: {userData.diamonds}</p></div>
);

const GroupMeetingUI = ({ onExit, userData }) => (
  <div className="meeting-overlay">
    <header className="meeting-header"><button onClick={onExit}><ArrowLeft/></button><span>SALA 8 ASIENTOS</span></header>
    <div className="meeting-grid-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="meeting-seat">
          <div className="seat-avatar-small">{i === 0 ? (userData.photoURL ? <img src={userData.photoURL} /> : 'Tú') : <UserPlus size={16} opacity={0.2}/>}</div>
        </div>
      ))}
    </div>
  </div>
);

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`nav-item-ig ${active ? 'active' : ''}`}>
    {icon}
    <span>{label}</span>
  </button>
);

const CameraModule = () => (<div className="card ig-post"><h3>Cámara Instagram</h3></div>);
const Login = () => (
  <div className="container center">
    <div className="card login-box">
      <h1>AMIGOS PUZ</h1>
      <button className="primary-btn" onClick={() => auth.signInAnonymously()}>ENTRAR COMO INVITADO</button>
    </div>
  </div>
);

export default App;
