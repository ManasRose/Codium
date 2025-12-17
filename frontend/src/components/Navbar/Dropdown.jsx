import React, { useState, useRef, useEffect } from "react";

const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      {React.cloneElement(trigger, { onClick: toggleDropdown })}

      {isOpen && <div className="dropdown-menu">{children}</div>}
    </div>
  );
};

export default Dropdown;
