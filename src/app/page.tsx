import { redirect } from "next/navigation";

// El proxy ya redirige según la sesión; esto cubre el caso sin proxy.
export default function Inicio() {
  redirect("/comandas");
}
