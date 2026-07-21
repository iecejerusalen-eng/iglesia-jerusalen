import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  "": "Inicio",
  "nosotros": "Sobre Nosotros",
  "ministerios": "Ministerios",
  "predicas": "Prédicas y Sermones",
  "escuela-dominical": "Escuela Dominical",
  "donaciones": "Donaciones",
  "recursos": "Recursos",
  "biblia": "La Santa Biblia",
  "alabanzas": "Alabanzas e Himnos",
  "plan-lectura": "Plan de Lectura",
  "tienda": "Tienda",
  "aula-virtual": "Aula Virtual",
  "eventos": "Eventos",
  "contacto": "Contacto",
  "estudiante": "Portal Estudiante",
  "profesor": "Portal Docente",
  "lms": "Plataforma de Aprendizaje",
  "admin": "Panel de Administración",
};

export const FooterBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div className="w-full bg-slate-950/40 backdrop-blur-md border-b border-white/10 py-3.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <Breadcrumb>
          <BreadcrumbList className="text-xs md:text-sm text-gray-300 flex-wrap justify-center">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1.5 hover:text-amber-400 text-gray-200 transition-colors">
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inicio</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;
              const isLast = index === pathnames.length - 1;
              const formattedName =
                routeNames[value.toLowerCase()] ||
                value.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

              return (
                <React.Fragment key={to}>
                  <BreadcrumbSeparator className="text-amber-400/80" />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-amber-300 font-bold drop-shadow-xs">
                        {formattedName}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={to} className="hover:text-amber-400 text-gray-300 transition-colors">
                          {formattedName}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
