import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import {
  Camera,
  Phone,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  UserPlus,
  MessageSquare,
  Globe,
  MoreVertical,
  ChevronLeft,
  X,
  Send,
  Volume2,
  Eye,
  EyeOff,
  LayoutGrid,
  Settings,
  Lock,
  Unlock,
  VolumeX,
  Gem,
  Gift,
  Heart,
  Star,
  Coffee,
  Ticket,
  Sparkles,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Variantes de Animación Globales ---
const pageVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 }
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [inGroupCall, setInGroupCall] = useState(false);
  const [diamonds, setDiamonds] = useState(1000);
  const [userLevel, setUserLevel] = useState(5);
  const [xp, setXp] = useState(45);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);

  // --- Manejo de Admin Oculto ---
  const handleTitleClick = () => {
    setAdminClickCount(prev => prev + 1);
    if (adminClickCount + 1 >= 5) {
      setIsAdmin(true);
      setAdminClickCount(0);
      alert("Panel de Administrador Activado");
    }
    setTimeout(() => setAdminClickCount(0), 5000); // Reset after 5s
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="container">
      <header>
        <div className="app-title" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>AMIGOS PUZ</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <motion.div
            key={diamonds} animate={{ scale: [1, 1.2, 1] }}
            className="diamond-badge"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 210, 255, 0.15)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--secondary)' }}
          >
            <Gem size={18} color="var(--secondary)" />
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{diamonds}</span>
          </motion.div>
          <div style={{ background: 'var(--primary)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
            LVL {userLevel}
          </div>
        </div>
      </header>

      <main className="content-area">
        <AnimatePresence mode="wait">
          {inGroupCall ? (
            <GroupMeetingUI key="meeting" group={selectedGroup} onExit={() => setInGroupCall(false)} userDiamonds={diamonds} setUserDiamonds={setDiamonds} />
          ) : selectedFriend || selectedGroup ? (
            <ChatArea
              key="chat"
              friend={selectedFriend || selectedGroup}
              isGroup={!!selectedGroup}
              onBack={() => { setSelectedFriend(null); setSelectedGroup(null); }}
              onJoinCall={() => setInGroupCall(true)}
              userDiamonds={diamonds}
              setUserDiamonds={setDiamonds}
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

      {
        !selectedFriend && !selectedGroup && !inGroupCall && (
          <nav>
            <NavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={<MessageSquare />} label="Muro" />
            <NavButton active={activeTab === 'friends'} onClick={() => setActiveTab('friends')} icon={<Users />} label="Amigos" />
            <NavButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')} icon={<UserPlus />} label="Grupos" />
            <NavButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={<Gem />} label="Tienda" />
            {isAdmin ? (
              <NavButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Lock />} label="Admin" />
            ) : (
              <NavButton active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} icon={<Camera />} label="Cmara" />
            )}
          </nav>
        )
      }
    </div >
  );
};

// --- ANIMACIÓN DE REGALO VOLADOR ---
const FlyingGift = ({ gift, fromRect, toRect, onComplete }) => {
  if (!fromRect || !toRect) return null;

  const startX = fromRect.left + fromRect.width / 2 - 40;
  const startY = fromRect.top + fromRect.height / 2 - 40;
  const endX = toRect.left + toRect.width / 2 - 40;
  const endY = toRect.top + toRect.height / 2 - 40;

  return (
    <motion.div
      initial={{ left: startX, top: startY, scale: 0, opacity: 0 }}
      animate={{
        left: [startX, (startX + endX) / 2, endX],
        top: [startY, startY - 150, endY],
        scale: [1, 2, 1.5],
        opacity: [1, 1, 1],
        rotate: [0, 180, 360]
      }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      style={{
        position: 'fixed',
        zIndex: 9999,
        fontSize: '60px',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 0 20px var(--secondary))'
      }}
    >
      {gift.id === 1 ? '🌹' : gift.id === 2 ? '☕' : gift.id === 3 ? '❤️' : gift.id === 4 ? '⭐' : '👑'}
    </motion.div>
  );
};

const GroupMeetingUI = ({ group, onExit, userDiamonds, setUserDiamonds }) => {
  const videoRef = useRef(null);
  const mySlotRef = useRef(null);
  const slotRefs = useRef({});
  const [activeFlyingGift, setActiveFlyingGift] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [videoOn, setVideoOn] = useState(true);

  useEffect(() => {
    if (videoOn) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
        if (videoRef.current) videoRef.current.srcObject = s;
      });
    }
  }, [videoOn]);

  const participants = [
    { id: 1, name: 'Ana Luz', color: '#9d50bb' },
    { id: 2, name: 'Juan C.', color: '#00d2ff' },
    { id: 3, name: 'Elena', color: '#ff4b2b' },
  ];

  const sendGift = (gift) => {
    if (userDiamonds < gift.price) return;
    setUserDiamonds(userDiamonds - gift.price);

    const fromRect = mySlotRef.current.getBoundingClientRect();
    const targetSlot = slotRefs.current[selectedUser.id];
    const toRect = targetSlot.getBoundingClientRect();

    setActiveFlyingGift({ gift, fromRect, toRect });
    setSelectedUser(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence>
        {activeFlyingGift && (
          <FlyingGift
            key="flying"
            gift={activeFlyingGift.gift}
            fromRect={activeFlyingGift.fromRect}
            toRect={activeFlyingGift.toRect}
            onComplete={() => setActiveFlyingGift(null)}
          />
        )}
      </AnimatePresence>

      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '18px' }}>Sala: {group?.name || 'Zerca Meeting'}</h2>
        <button className="icon-btn secondary-btn" onClick={onExit}><X /></button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px' }}>
        <motion.div
          ref={mySlotRef}
          className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', border: '3px solid var(--primary)' }}
          onClick={() => setSelectedUser({ id: 'me', name: 'Tú' })}
        >
          {videoOn ? <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="avatar" style={{ width: 80, height: 80, margin: 'auto' }}>YO</div>}
          <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '12px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>Tú</div>
        </motion.div>

        {participants.map(p => (
          <motion.div
            key={p.id}
            ref={el => slotRefs.current[p.id] = el}
            className="card" style={{ padding: 0, background: '#111', cursor: 'pointer', position: 'relative' }}
            onClick={() => setSelectedUser(p)}
          >
            <div className="avatar" style={{ width: 70, height: 70, margin: 'auto', background: p.color }}>{p.name[0]}</div>
            <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: '12px' }}>{p.name}</div>
          </motion.div>
        ))}
      </div>

      {/* Controles */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '20px', background: 'rgba(0,0,0,0.8)' }}>
        <button className="icon-btn secondary-btn" onClick={() => setVideoOn(!videoOn)}>{videoOn ? <Video /> : <VideoOff />}</button>
        <button className="primary-btn" style={{ background: 'var(--error)', padding: '0 40px' }} onClick={onExit}>SALIR</button>
      </div>

      {/* Menú de Regalo Overlay */}
      <AnimatePresence>
        {selectedUser && selectedUser.id !== 'me' && (
          <motion.div
            initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--surface-opaque)', padding: '30px', borderRadius: '30px 30px 0 0', zIndex: 3000 }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>Enviar a {selectedUser.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {[{ id: 1, name: 'Rosa', price: 0 }, { id: 2, name: 'Café', price: 10 }, { id: 3, name: '❤️', price: 50 }, { id: 4, name: '⭐', price: 100 }, { id: 5, name: '👑', price: 500 }].map(g => (
                <button key={g.id} className="secondary-btn" style={{ flexDirection: 'column', padding: '15px 0' }} onClick={() => sendGift(g)}>
                  <span style={{ fontSize: '24px' }}>{g.id === 1 ? '🌹' : g.id === 2 ? '☕' : g.id === 3 ? '❤️' : g.id === 4 ? '⭐' : '👑'}</span>
                  <span style={{ fontSize: '10px' }}>{g.price} 💎</span>
                </button>
              ))}
            </div>
            <button className="secondary-btn" style={{ width: '100%', marginTop: '20px' }} onClick={() => setSelectedUser(null)}>Cancelar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    // Regla Crítica: No puntos antes del @
    const parts = email.split('@');
    if (parts.length !== 2 || parts[0].includes('.')) {
      setError('El correo no puede tener puntos antes del @');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      onLogin(data.user);
    } catch (err) {
      console.error("Login error:", err.message);
      setError('Credenciales inválidas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="card" style={{ textAlign: 'center', padding: '40px', width: '90%', maxWidth: '400px' }}>
        <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '25px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles color="white" size={40} /></div>
        <h1 style={{ fontSize: '32px', letterSpacing: '2px', marginBottom: '20px' }}>AMIGOS PUZ</h1>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px', display: 'block' }}>Correo Electrónico</label>
            <input
              type="email"
              placeholder="usuario@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '12px', opacity: 0.7, marginBottom: '5px', display: 'block' }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {error && <div style={{ color: 'var(--error)', fontSize: '13px', marginTop: '10px' }}>{error}</div>}

          <button type="submit" disabled={loading} className="primary-btn" style={{ width: '100%', marginTop: '10px' }}>
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const FeedModule = () => (
  <div className="fade-in">
    <h3>Muro Social</h3>
    <AdMobBanner />
    {[1, 2].map(i => (
      <div key={i} className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div className="avatar" style={{ width: 40, height: 40 }}>U</div>
          <div>Publicación {i}</div>
        </div>
        <div style={{ height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
      </div>
    ))}
    <AdMobBanner />
  </div>
);

// --- COMPONENTES DE REPARACIÓN (ADMOB & ADMIN) ---

const AdMobBanner = () => (
  <div style={{
    margin: '10px 0',
    padding: '10px',
    background: '#333',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px dashed #666',
    fontSize: '12px',
    color: '#aaa'
  }}>
    <span style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>ANUNCIO ADMOB</span>
    Espacio publicitario configurado (ID: pub-8524...)
  </div>
);

const AdminPanel = () => {
  const [stats, setStats] = useState({ users: 0, activity: 'Cargando...' });

  useEffect(() => {
    const fetchStats = async () => {
      // Intentar obtener conteo real de usuarios de Supabase
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        setStats({ users: count || 0, activity: 'Alta' });
      } else {
        // Fallback si la tabla no existe aún
        setStats({ users: 1, activity: 'Pruebas' });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="fade-in">
      <h3>Panel de Control Supabase</h3>
      <div className="card" style={{ border: '1px solid var(--secondary)' }}>
        <p><strong>Estado del Proyecto:</strong> <span style={{ color: '#00ff00' }}>CONECTADO</span></p>
        <p style={{ fontSize: '12px', opacity: 0.7 }}>URL: {import.meta.env.VITE_SUPABASE_URL}</p>
        <hr style={{ margin: '15px 0', opacity: 0.1 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px' }}>{stats.users}</div>
            <div style={{ fontSize: '10px' }}>Usuarios</div>
          </div>
          <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px' }}>{stats.activity}</div>
            <div style={{ fontSize: '10px' }}>Actividad</div>
          </div>
        </div>
        <button className="primary-btn" style={{ width: '100%', marginTop: '20px' }}>SINCRONIZAR BASE DE DATOS</button>
      </div>
    </div>
  );
};

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
      <div key={i} className="friend-item" style={{ background: 'rgba(157, 80, 187, 0.1)' }} onClick={() => onSelect({ id: i + 200, name })}>
        <div className="avatar" style={{ background: 'var(--primary)' }}><Users /></div>
        <div>{name}</div>
      </div>
    ))}
  </div>
);

const StoreModule = ({ diamonds, setDiamonds, userLevel, xp }) => (
  <div className="fade-in">
    <h3>Tienda de Lujo</h3>
    <div className="card" style={{ background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span>Nivel {userLevel}</span>
        <Trophy size={20} />
      </div>
      <div style={{ background: 'rgba(0,0,0,0.2)', height: '10px', borderRadius: '5px' }}>
        <div style={{ width: `${xp}%`, background: '#fff', height: '100%', borderRadius: '5px' }}></div>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
      {[100, 500, 1000, 5000].map(amt => (
        <div key={amt} className="card" onClick={() => setDiamonds(diamonds + amt)} style={{ cursor: 'pointer', textAlign: 'center' }}>
          <Gem size={32} color="var(--secondary)" />
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{amt}</div>
        </div>
      ))}
    </div>
  </div>
);

const CameraModule = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let currentStream = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(s => {
        currentStream = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(err => {
        console.error("Error accessing camera:", err);
        setError("No se pudo activar la cámara. Revisa los permisos.");
      });

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', minHeight: '300px' }}>
      {error ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <VideoOff size={60} color="var(--error)" style={{ marginBottom: '15px' }} />
          <p style={{ fontSize: '14px', opacity: 0.8 }}>{error}</p>
          <button className="secondary-btn" onClick={() => window.location.reload()} style={{ marginTop: '15px' }}>Reintentar</button>
        </div>
      ) : stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }}
        />
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="avatar-pulse" style={{ margin: '0 auto 20px' }}><Camera size={40} /></div>
          <p>Iniciando lento...</p>
        </div>
      )}
    </div>
  );
};

const ChatArea = ({ friend, onBack, isGroup, onJoinCall, userDiamonds, setUserDiamonds }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <header>
      <button onClick={onBack} className="icon-btn secondary-btn"><ChevronLeft /></button>
      <div style={{ flex: 1, marginLeft: '12px' }}>{friend.name}</div>
      {isGroup && <button className="primary-btn" onClick={onJoinCall}>SALA</button>}
    </header>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>Chatea con {friend.name}</div>
    <div className="chat-input-area" style={{ margin: '16px' }}>
      <input placeholder="Mensaje..." />
      <button className="primary-btn icon-btn"><Send /></button>
    </div>
  </div>
);

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ flexDirection: 'column', background: 'transparent', color: active ? 'var(--secondary)' : 'rgba(255,255,255,0.4)', padding: '10px', minHeight: 'auto', gap: '4px', width: '20%' }}>
    <motion.div animate={active ? { y: -5, scale: 1.2 } : {}}>{icon}</motion.div>
    <span style={{ fontSize: '10px' }}>{label}</span>
  </button>
);

export default App;
