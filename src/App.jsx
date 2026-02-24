import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider
} from "firebase/auth";
import {
  Camera,
  Users,
  UserPlus,
  MessageSquare,
  ChevronLeft,
  X,
  Send,
  Gem,
  Sparkles,
  Trophy,
  Facebook,
  Gamepad2,
  PlayCircle,
  Lock,
  Star,
  VideoOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Variantes de Animación ---
const pageVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [inGroupCall, setInGroupCall] = useState(false);
  const [diamonds, setDiamonds] = useState(1000);
  const [userLevel, setUserLevel] = useState(5);
  const [xp, setXp] = useState(45);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="container" style={{justifyContent:'center', alignItems:'center'}}><div className="avatar-pulse">Cargando...</div></div>;

  if (!user) {
    return <Login />;
  }

  const handleAdminAccess = () => {
    if (user.email !== 'votija03051996@gmail.com') return;
    setShowPinModal(true);
  };

  const verifyPin = () => {
    if (pinInput === "199676") {
      setIsAdmin(true);
      setActiveTab('admin');
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert("PIN Incorrecto");
      setPinInput('');
    }
  };

  return (
    <div className="container">
      <header>
        <div className="app-title" onClick={handleAdminAccess} style={{ cursor: user.email === 'votija03051996@gmail.com' ? 'pointer' : 'default' }}>
          AMIGOS PUZ
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <motion.div key={diamonds} animate={{ scale: [1, 1.2, 1] }} className="diamond-badge">
            <Gem size={18} color="var(--primary)" />
            <span>{diamonds}</span>
          </motion.div>
          <div className="lvl-badge">LVL {userLevel}</div>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {inGroupCall ? (
            <GroupMeetingUI key="meeting" onExit={() => setInGroupCall(false)} userDiamonds={diamonds} setUserDiamonds={setDiamonds} />
          ) : selectedFriend || selectedGroup ? (
            <ChatArea
              friend={selectedFriend || selectedGroup}
              onBack={() => { setSelectedFriend(null); setSelectedGroup(null); }}
              onJoinCall={() => setInGroupCall(true)}
            />
          ) : (
            <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ height: '100%' }}>
              {activeTab === 'feed' && <FeedModule />}
              {activeTab === 'friends' && <FriendsList onSelect={setSelectedFriend} />}
              {activeTab === 'groups' && <GroupsModule onSelect={setSelectedGroup} />}
              {activeTab === 'store' && <StoreModule diamonds={diamonds} setDiamonds={setDiamonds} userLevel={userLevel} xp={xp} />}
              {activeTab === 'camera' && <CameraModule />}
              {isAdmin && activeTab === 'admin' && <AdminPanel />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showPinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card modal-card">
              <Lock size={40} color="var(--primary)" style={{ marginBottom: '15px' }} />
              <h3>Acceso Privado</h3>
              <input
                type="password"
                inputMode="numeric"
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button className="secondary-btn" onClick={() => setShowPinModal(false)}>X</button>
                <button className="primary-btn" style={{flex:1}} onClick={verifyPin}>ENTRAR</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedFriend && !selectedGroup && !inGroupCall && (
        <nav>
          <NavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<MessageSquare />} label="Muro" />
          <NavButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} icon={<Users />} label="Amigos" />
          <NavButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<UserPlus />} label="Grupos" />
          <NavButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<Gem />} label="Tienda" />
          {isAdmin ? (
            <NavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Lock />} label="Admin" />
          ) : (
            <NavButton active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} icon={<Camera />} label="Cámara" />
          )}
        </nav>
      )}
    </div>
  );
};

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Error de autenticación: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (providerName) => {
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Error con " + providerName);
    }
  };

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="card login-card">
        <div className="login-logo"><Sparkles color="white" size={30} /></div>
        <h1>AMIGOS PUZ</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Cargando...' : (isRegistering ? 'CREAR CUENTA' : 'ENTRAR')}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="toggle-auth-btn">
          {isRegistering ? '¿Ya tienes cuenta? Entra' : '¿Nuevo? Regístrate'}
        </button>
        <div className="social-login">
          <button onClick={() => handleSocial('google')} className="secondary-btn social-btn">Google</button>
          <button onClick={() => handleSocial('facebook')} className="secondary-btn social-btn">Facebook</button>
        </div>
        <p className="legal-footer">
          Al continuar, aceptas nuestros <a href="/terminos.html">Términos</a> y <a href="/privacidad.html">Privacidad</a>.
        </p>
      </motion.div>
    </div>
  );
};

const StoreModule = ({ diamonds, setDiamonds, userLevel, xp }) => (
  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div className="card level-card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Nivel {userLevel}</span>
        <Trophy size={20} />
      </div>
      <div className="xp-bar">
        <motion.div initial={{ width: 0 }} animate={{ width: `${xp}%` }} className="xp-fill"></motion.div>
      </div>
    </div>

    <div className="card reward-hero">
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="shield-container">
        <div className="shield-inner">
          <Gamepad2 size={40} color="white" />
          <div className="shield-text">PLAY</div>
        </div>
        <Star className="shield-star" fill="#f1c40f" size={24} />
      </motion.div>
      <h2>Diamantes: {diamonds}</h2>
      <button className="primary-btn reward-btn" onClick={() => setDiamonds(diamonds + 100)}>
        <PlayCircle size={24} />
        <div>
          <span style={{fontSize:'12px', opacity:0.8}}>Ver Video para ganar</span>
          <span style={{display:'block', fontWeight:'bold'}}>100 Diamantes</span>
        </div>
      </button>
    </div>

    <div className="pack-grid">
      {[500, 1000, 5000, 10000].map(amt => (
        <div key={amt} className="card pack-card" onClick={() => setDiamonds(diamonds + amt)}>
          <Gem size={30} color="var(--primary)" />
          <div className="pack-amt">+{amt}</div>
        </div>
      ))}
    </div>
  </div>
);

// --- OTROS COMPONENTES ---
const FeedModule = () => (
  <div className="fade-in">
    <h3>Muro Social</h3>
    <div className="card" style={{height:'100px', opacity:0.3, display:'flex', alignItems:'center', justifyContent:'center'}}>Anuncio</div>
    {[1, 2].map(i => (
      <div key={i} className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div className="avatar">U</div>
          <div>Publicación {i}</div>
        </div>
        <div className="post-media"></div>
      </div>
    ))}
  </div>
);

const FriendsList = ({ onSelect }) => (
  <div className="fade-in">
    <h3>Amigos</h3>
    {['Ana Luz', 'Juan Carlos', 'Elena'].map((name, i) => (
      <div key={i} className="friend-item" onClick={() => onSelect({ id: i, name })}>
        <div className="avatar">{name[0]}</div>
        <div>{name}</div>
      </div>
    ))}
  </div>
);

const GroupsModule = ({ onSelect }) => (
  <div className="fade-in">
    <h3>Tus Grupos</h3>
    {['Grupo de Apoyo', 'Cine Club'].map((name, i) => (
      <div key={i} className="friend-item group-item" onClick={() => onSelect({ id: i + 200, name })}>
        <div className="avatar"><Users /></div>
        <div>{name}</div>
      </div>
    ))}
  </div>
);

const CameraModule = () => (
  <div className="card camera-placeholder">
    <VideoOff size={60} color="var(--error)" />
    <p>La cámara se activará en la versión APK</p>
  </div>
);

const ChatArea = ({ friend, onBack, onJoinCall }) => (
  <div className="chat-container">
    <header>
      <button onClick={onBack} className="icon-btn"><ChevronLeft /></button>
      <div style={{ flex: 1 }}>{friend.name}</div>
      <button className="primary-btn" onClick={onJoinCall}>SALA</button>
    </header>
    <div className="chat-messages">Chatea con {friend.name}</div>
    <div className="chat-input-area">
      <input placeholder="Mensaje..." />
      <button className="primary-btn"><Send /></button>
    </div>
  </div>
);

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`nav-btn ${active ? 'active' : ''}`}>
    <motion.div animate={active ? { y: -5, scale: 1.2 } : {}}>{icon}</motion.div>
    <span>{label}</span>
  </button>
);

const GroupMeetingUI = ({ onExit }) => (
  <div className="meeting-overlay">
    <header>
      <h2>Sala de Grupo</h2>
      <button onClick={onExit} className="icon-btn"><X /></button>
    </header>
    <div className="meeting-grid">
      <div className="card meeting-slot">Tú</div>
      <div className="card meeting-slot">Ana</div>
    </div>
    <div className="meeting-controls">
      <button className="primary-btn exit-call-btn" onClick={onExit}>SALIR</button>
    </div>
  </div>
);

const AdminPanel = () => (
  <div className="fade-in">
    <h3>Panel de Administración</h3>
    <div className="card admin-card">
      <p>Usuarios Registrados: 1</p>
      <p>Estado de Firebase: <span style={{color:'#00ff00'}}>Conectado</span></p>
      <button className="primary-btn" style={{width:'100%', marginTop:'10px'}}>Gestionar Usuarios</button>
    </div>
  </div>
);

export default App;
