import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useMeasure from "react-use-measure";
import {
  useDragControls,
  useMotionValue,
  useAnimate,
  motion,
} from "framer-motion";
import "../styles/Dashboard.css";

const DashboardPage = () => {
  const [openDrawer, setOpenDrawer] = useState(null); // 'admin', 'public', 'leader'
  return (
    <div className="dashboard-wrapper">
      <button
        className="dashboard-button"
        onClick={() => setOpenDrawer("admin")}
      >
        Admin Panel
      </button>
      <button
        className="dashboard-button"
        onClick={() => setOpenDrawer("public")}
      >
        Public Panel
      </button>
      <button
        className="dashboard-button"
        onClick={() => setOpenDrawer("leader")}
      >
        Leaderboard
      </button>

      <Drawer open={openDrawer === "admin"} setOpen={() => setOpenDrawer(null)}>
        <AdminDrawerContent />
      </Drawer>

      <Drawer open={openDrawer === "public"} setOpen={() => setOpenDrawer(null)}>
        <NavigateButton label="Enter Public Panel" route="/public" />
      </Drawer>

      <Drawer open={openDrawer === "leader"} setOpen={() => setOpenDrawer(null)}>
        <NavigateButton label="View Leaderboard" route="/leaderboard" />
      </Drawer>
    </div>
  );
};

export default DashboardPage;

const Drawer = ({ open, setOpen, children }) => {
  const [scope, animate] = useAnimate();
  const [drawerRef, { height }] = useMeasure();
  const y = useMotionValue(0);
  const controls = useDragControls();

  const handleClose = async () => {
    animate(scope.current, { opacity: [1, 0] });
    const yStart = typeof y.get() === "number" ? y.get() : 0;
    await animate("#drawer", { y: [yStart, height] });
    setOpen(false);
  };

  return open ? (
    <motion.div
      ref={scope}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleClose}
      className="drawer-overlay"
    >
      <motion.div
        id="drawer"
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ ease: "easeInOut" }}
        className="drawer-container"
        style={{ y }}
        drag="y"
        dragControls={controls}
        onDragEnd={() => {
          if (y.get() >= 100) handleClose();
        }}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
      >
        <div className="drawer-handle-wrapper">
          <button
            onPointerDown={(e) => controls.start(e)}
            className="drawer-handle"
          ></button>
        </div>
        <div className="drawer-content">{children}</div>
      </motion.div>
    </motion.div>
  ) : null;
};

const AdminDrawerContent = () => {
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔐 Use correct prefix based on your build tool
  // const expectedKey =
  //   process.env.REACT_APP_PRIVATE_KEY;

  const handleAccess = (e) => {
    const expectedKey = import.meta.env.VITE_PRIVATE_KEY;

    const entered = inputKey.trim();


    if (!expectedKey) {
      setError("⚠️ Admin private key is not configured.");
      return;
    }

    if (entered === expectedKey) {
      setError("");
      navigate("/admin");
    } else {
      setError("Access denied. Invalid private key.");
    }
  };
  return (
    <div className="admin-auth">
      <h2 className="modal-title">Admin Access</h2>
      <p className="modal-desc">Enter Admin's private key to access the Admin Panel:</p>
      <input
        type="password"
        placeholder="Enter Private Key 0x..."
        value={inputKey}
        onChange={(e) => setInputKey(e.target.value)}
        className="admin-input"
      />
      {error && <p className="error-text">{error}</p>}
      <button className="admin-submit-btn" onClick={handleAccess}>
        Access Admin Panel
      </button>
    </div>
  );
};

const NavigateButton = ({ label, route }) => {
  const navigate = useNavigate();
  return (
    <div className="modal-content">
      <h2 className="modal-title">{label}</h2>
      <button className="admin-submit-btn" onClick={() => navigate(route)}>
        Continue
      </button>
    </div>
  );
};
