import React, { useState, useRef, useEffect } from "react";

// This is a reusable dropdown component.
// It takes a `trigger` element (what you click on) and `children` (the menu content)
const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // This effect adds an event listener to the whole document.
  // If a click happens outside the dropdown's area (`dropdownRef`), it closes the menu.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Add the event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggles the dropdown's visibility
  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    // The main container that we use to detect outside clicks
    <div className="dropdown-container" ref={dropdownRef}>
      {/* We take the trigger element (e.g., a button or an image) and add our toggle function to its onClick event */}
      {React.cloneElement(trigger, { onClick: toggleDropdown })}

      {/* The dropdown menu is only rendered if `isOpen` is true */}
      {isOpen && <div className="dropdown-menu">{children}</div>}
    </div>
  );
};

export default Dropdown;
