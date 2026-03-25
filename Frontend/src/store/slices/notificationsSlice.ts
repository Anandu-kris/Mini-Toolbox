import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppNotification } from "@/types/notifications.types";

type NotificationsState = {
  items: AppNotification[];
  dayKey: string | null;
};

function getLocalDayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const initialState: NotificationsState = {
  items: [],
  dayKey: getLocalDayKey(),
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearIfDayChanged(state) {
      const today = getLocalDayKey();

      if (state.dayKey !== today) {
        state.items = [];
        state.dayKey = today;
      }
    },

    addNotification(state, action: PayloadAction<AppNotification>) {
      const today = getLocalDayKey();

      if (state.dayKey !== today) {
        state.items = [];
        state.dayKey = today;
      }

      const exists = state.items.some((item) => item.id === action.payload.id);
      if (exists) return;

      state.items.unshift(action.payload);
    },

    markNotificationRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) {
        item.read = true;
      }
    },

    markAllNotificationsRead(state) {
      state.items.forEach((item) => {
        item.read = true;
      });
    },

    clearNotifications(state) {
      state.items = [];
      state.dayKey = getLocalDayKey();
    },
  },
});

export const {
  clearIfDayChanged,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;