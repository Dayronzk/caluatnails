import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Tag,
  Scissors,
  CalendarDays,
  Ticket,
  Link2,
  ShoppingBag,
  Smartphone,
  Bot,
  Send,
  GripVertical,
  ClipboardList,
  Wallet,
  Bell,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
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
  { id: "modulos", path: "/admin/modulos", icon: BookOpen, label: "Módulos" },
  { id: "lecciones", path: "/admin/lecciones", icon: GraduationCap, label: "Lecciones" },
  { id: "etiquetas", path: "/admin/etiquetas", icon: Tag, label: "Etiquetas" },
  { id: "estudiantes", path: "/admin/estudiantes", icon: Users, label: "Estudiantes" },
  { id: "clientes", path: "/admin/clientes", icon: ShoppingBag, label: "Clientes" },
  { id: "cupones", path: "/admin/cupones", icon: Ticket, label: "Cupones" },
  { id: "foro", path: "/admin/foro", icon: MessageCircle, label: "Foro" },
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
        className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <NavLink
        to={item.path}
        onClick={onClick}
        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
          isActive
            ? "bg-rose-50 text-rose-600 font-medium"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm">{item.label}</span>
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
        
        // Find items that are in INITIAL_NAV_ITEMS but NOT in savedItems
        const newItems = INITIAL_NAV_ITEMS.filter(initial => !savedItems.find(saved => saved.id === initial.id));
        
        return [...savedItems, ...newItems];
      } catch (e) {
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
        
        // Save to localStorage
        localStorage.setItem("admin-sidebar-order", JSON.stringify(newItems.map(i => i.id)));
        return newItems;
      });
    }
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <div className="ml-3">
            <h1 className="font-bold text-gray-900">Manicure Pro</h1>
            <p className="text-xs text-gray-400">Panel de Administración</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 128px)" }}>
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

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Volver al sitio</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}