import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const PopUp = ({ unit, position = { x: 0, y: 0 } }) => {
  if (!unit || !position) return null;
  const { name, status, type, area, floor } = unit || {};

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`,
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "10px",
        borderRadius: "4px",
        zIndex: "1001",
        pointerEvents: "none",
        fontSize: "12px",
        maxWidth: "200px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      }}
    >
      <div>
        <strong>Unit:</strong> {name}
      </div>
      <div>
        <strong>Status:</strong>
        <span
          style={{
            color: status === "available" ? "#4CAF50" : "#F44336",
          }}
        >
          {status}
        </span>
      </div>
      <div>
        <strong>Type:</strong> {type || "N/A"}
      </div>
      <div>
        <strong>Area:</strong> {area || "N/A"}
      </div>
      <div>
        <strong>Floor:</strong> {floor || "N/A"}
      </div>
    </div>,
    document.body
  );
};

export default PopUp;
