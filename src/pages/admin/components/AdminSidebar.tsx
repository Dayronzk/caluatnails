import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Scissors,
  CalendarDays,
  Ticket,
  Link2,
  ShoppingBag,
  Bot,
  Send,
  GripVertical,
  ClipboardList,
  Wallet,
  Bell,
  ShieldCheck,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const INITIAL_NAV_ITEMS = [
  { id: "dashboard", path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { id: "clientes", path: "/admin/clientes", icon: ShoppingBag, label: "Clientes" },
  { id: "profesionales", path: "/admin/profesionales", icon: Users, label: "Profesionales" },
  { id: "cupones", path: "/admin/cupones", icon: Ticket, label: "Cupones" },
  { id: "servicios", path: "/admin/servicios", icon: Scissors, label: "Servicios" },
  { id: "agenda", path: "/admin/agenda", icon: CalendarDays, label: "Agenda" },
  { id: "whatsapp", path: "/admin/whatsapp", icon: Bot, label: "WhatsApp Bot" },
  { id: "campanas", path: "/admin/campanas", icon: Send, label: "Campañas" },
  { id: "notificaciones", path: "/admin/notificaciones", icon: Bell, label: "Notificaciones" },
  { id: "garantias", path: "/admin/garantias", icon: ShieldCheck, label: "Garantías" },
  { id: "suscripciones", path: "/admin/suscripciones", icon: Ticket, label: "Suscripciones" },
  { id: "referidos", path: "/admin/referidos", icon: Link2, label: "Referidos" },
  { id: "inventario", path: "/admin/inventario", icon: ClipboardList, label: "Inventario" },
  { id: "gastos", path: "/admin/gastos", icon: Wallet, label: "Gastos" },
  { id: "ingresos", path: "/admin/ingresos", icon: TrendingUp, label: "Ingresos" },
  { id: "tienda", path: "/admin/tienda", icon: ShoppingBag, label: "Tienda" },
  { id: "configuracion", path: "/admin/configuracion", icon: Settings, label: "Configuración" },
];

interface SortableItemProps {
  item: typeof INITIAL_NAV_ITEMS[0];
  isActive: boolean;
  onClick: () => void;
}

function SortableNavItem({ item, isActive, onClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 transition-all ${isDragging ? "opacity-50 scale-105" : ""}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <NavLink
        to={item.path}
        onClick={onClick}
        className={`flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-semibold text-xs ${
          isActive
            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-soft-xs"
            : "text-gray-700 hover:bg-rose-50/60 hover:text-rose-600"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("admin-sidebar-order");
    if (saved) {
      try {
        const orderIds = JSON.parse(saved);
        const savedItems = orderIds.map((id: string) => INITIAL_NAV_ITEMS.find(i => i.id === id)).filter(Boolean);
        const newItems = INITIAL_NAV_ITEMS.filter(initial => !savedItems.find(saved => saved.id === initial.id));
        return [...savedItems, ...newItems];
      } catch {
        return INITIAL_NAV_ITEMS;
      }
    }
    return INITIAL_NAV_ITEMS;
  });

  const location = useLocation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("admin-sidebar-order", JSON.stringify(newItems.map(i => i.id)));
        return newItems;
      });
    }
  }

  return (
    <>
      {/* Mobile button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-soft-md flex items-center justify-center border border-rose-100 text-gray-800"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white/95 backdrop-blur-md border-r border-rose-100/80 z-50 transition-transform duration-300 flex flex-col justify-between shadow-soft-xs ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header Logo */}
        <div className="h-20 flex items-center px-6 border-b border-rose-100/60 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-soft-xs">
            <i className="ri-sparkles-line" />
          </div>
          <div className="ml-3 min-w-0">
            <h1 className="font-playfair font-extrabold text-gray-900 text-base leading-none tracking-wider">
              CALUATNAILS
            </h1>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">
              Panel de Control
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 overflow-y-auto no-scrollbar flex-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {items.map((item) => (
                  <SortableNavItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </nav>

        {/* Footer Link */}
        <div className="p-4 border-t border-rose-100/60 bg-rose-50/30 shrink-0">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-700 hover:bg-white hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Volver al sitio web</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}