import React from "react";

const UnitInfoPopup = ({ unit, onClose }) => {
  if (!unit) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1000,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "20px",
        borderRadius: "8px",
        width: "250px",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <h3>Unit: {unit.name}</h3>
      <p>
        Status:{" "}
        <span
          style={{
            color: unit.status === "available" ? "#4CAF50" : "#F44336",
          }}
        >
          {unit.status}
        </span>
      </p>
      <p>Type: {unit.type}</p>
      <p>Area: {unit.area}</p>
      <p>Price: {unit.price}</p>
      <p>Floor: {unit.floor}</p>
      <p>Direction: {unit.direction}</p>
      <button
        onClick={onClose}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          background: "red",
          border: "none",
          color: "white",
          cursor: "pointer",
          borderRadius: "5px",
        }}
      >
        Close
      </button>
    </div>
  );
};

export default UnitInfoPopup;
