import {
  Building2,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  Percent,
  Settings,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  requiredRoles: string[];
  submenus?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/dashboard",
    icon: "layoutDashboard",
    requiredRoles: ["administrator", "salesperson", "billing", "inventory", "admin"],
  },
  {
    id: "products",
    name: "Produtos",
    path: "/products",
    icon: "shoppingBag",
    requiredRoles: ["administrator", "inventory", "admin"],
  },
  {
    id: "categories",
    name: "Categorias",
    path: "/categories",
    icon: "boxes",
    requiredRoles: ["administrator", "inventory", "admin"],
  },
  {
    id: "customers",
    name: "Clientes",
    path: "/customers",
    icon: "users",
    requiredRoles: ["administrator", "salesperson", "billing", "admin"],
  },
  {
    id: "orders",
    name: "Pedidos",
    path: "/orders",
    icon: "checkCircle2",
    requiredRoles: ["administrator", "salesperson", "billing", "admin"],
  },
  {
    id: "settings",
    name: "Configurações",
    path: "/settings",
    icon: "settings",
    requiredRoles: ["administrator", "admin"],
    submenus: [
      {
        id: "company-settings",
        name: "Dados da Empresa",
        path: "/settings/company",
        icon: "building-2",
        requiredRoles: ["administrator", "admin"],
      },
      {
        id: "discounts",
        name: "Descontos",
        path: "/settings/discounts",
        icon: "percent",
        requiredRoles: ["administrator", "admin"],
      },
      {
        id: "users",
        name: "Usuários",
        path: "/settings/users",
        icon: "users",
        requiredRoles: ["administrator", "admin"],
      },
      {
        id: "transport-companies",
        name: "Gerenciar Transportadoras",
        path: "/settings/transport-companies",
        icon: "truck",
        requiredRoles: ["administrator", "admin"],
      },
    ],
  },
];
