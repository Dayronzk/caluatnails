import { useState } from "react";
import { AdminSidebar } from "@/pages/admin/components/AdminSidebar";
import { Bell, Zap, FileText, ClipboardList, MessageCircle } from "lucide-react";

import AutomationsTab from "@/pages/admin/campanas/components/AutomationsTab";
import TemplatesTab from "@/pages/admin/campanas/components/TemplatesTab";
import NotificationLogsTab from "@/pages/admin/campanas/components/NotificationLogsTab";
import WhatsAppReadonlyTab from "./components/WhatsAppReadonlyTab";

const TABS = [
  { id: "automations",  label: "Automatizaciones", icon: Zap,           desc: "Flujos programados y recordatorios" },
  { id: "templates",    label: "Plantillas",       icon: FileText,      desc: "Editor de mensajes por canal y tipo" },
  { id: "whatsapp",     label: "WhatsApp",         icon: MessageCircle, desc: "Historial de mensajes WhatsApp (solo lectura)" },
  { id: "logs",         label: "Registro",         icon: ClipboardList, desc: "Historial completo de todos los envíos" },
];

export default function NotificacionesPage() {
  const [activeTab, setActiveTab] = useState("automations");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Centro de Notificaciones</h1>
              <p className="text-sm text-gray-400">Gestiona todos los canales de comunicación desde un solo lugar</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-2 shadow-sm w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab description */}
        <p className="text-xs text-gray-400 mb-6 font-medium uppercase tracking-wider">
          {TABS.find(t => t.id === activeTab)?.desc}
        </p>

        {/* Tab content */}
        <div>
          {activeTab === "automations" && <AutomationsTab />}
          {activeTab === "templates"   && <TemplatesTab />}
          {activeTab === "whatsapp"    && <WhatsAppReadonlyTab />}
          {activeTab === "logs"        && <NotificationLogsTab />}
        </div>

      </main>
    </div>
  );
}
