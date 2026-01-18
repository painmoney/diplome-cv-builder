// src/components/Layout/Sidebar.jsx
import React from "react";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton component={Link} to="/dashboard">
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton component={Link} to="/resume-preview">
          <ListItemText primary="Просмотр резюме" />
        </ListItemButton>
      </ListItem>
    </List>
  );
}
