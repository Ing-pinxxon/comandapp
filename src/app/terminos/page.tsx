import Link from "next/link";
import type { Metadata } from "next";
import { Apartado, PaginaLegal } from "@/components/landing/PaginaLegal";

export const metadata: Metadata = {
  title: "Condiciones del servicio",
  description: "Qué ofrece Comandapp, qué se espera de cada negocio que lo usa, qué pasa con tus datos y qué no prometemos.",
  alternates: { canonical: "/terminos" },
};

export default function PaginaTerminos() {
  return (
    <PaginaLegal titulo="Condiciones del servicio" actualizado="22 de septiembre de 2026">
      <p>
        Estas son las reglas de uso de Comandapp. Están escritas para entenderse de una lectura. Al crear una cuenta, las aceptas.
      </p>

      <Apartado titulo="Qué es Comandapp">
        <p>
          Un sistema para tomar pedidos en una tablet, verlos en cocina con semáforo de tiempos y revisar después qué se vendió. Está pensado para comida
          para llevar y domicilios. <b>No maneja mesas ni cuentas por mesa</b>, y no es un sistema contable ni de facturación electrónica: los totales que
          calcula son para operar el día, no reemplazan tu contabilidad ni tus obligaciones con la DIAN.
        </p>
      </Apartado>

      <Apartado titulo="Quién lo presta">
        <p>Daniel Pinzón (Inge Pinzón), desarrollador independiente, en Colombia. El contacto está al final de esta página.</p>
      </Apartado>

      <Apartado titulo="Cuánto cuesta">
        <p>
          Hoy es <b>gratis durante el lanzamiento</b>: sin límite de pedidos ni de empleados y sin tarjeta de crédito. Cuando empecemos a cobrar,{" "}
          <b>te avisamos con un mes de anticipación</b> y podrás decidir si sigues o te llevas tus datos. No vamos a cobrarte sin avisar.
        </p>
      </Apartado>

      <Apartado titulo="Tu cuenta y tu equipo">
        <ul className="list-disc space-y-2 pl-5">
          <li>Eres responsable de lo que se haga desde tu cuenta, incluido lo que hagan tus empleados con su PIN.</li>
          <li>Los PIN son para separar quién toma cada pedido, no son una caja fuerte. Cámbialos cuando alguien salga del equipo.</li>
          <li>Una cuenta puede tener varios negocios; cada uno ve solo lo suyo.</li>
        </ul>
      </Apartado>

      <Apartado titulo="Los datos de tus clientes son tuyos, y tuya es la responsabilidad">
        <p>
          El nombre y el teléfono que tu personal escribe al tomar un pedido los recoges tú. Nosotros los guardamos por encargo tuyo para prestarte el
          servicio. Eso significa dos cosas: <b>los datos del negocio y de sus clientes son del negocio</b> —puedes exportarlos a Excel cuando quieras desde el
          panel— y también que <b>eres tú quien responde ante tus clientes</b> por pedirlos y usarlos bien. No cargues en Comandapp datos que no necesites para
          despachar un pedido.
        </p>
      </Apartado>

      <Apartado titulo="Lo que no se puede hacer">
        <ul className="list-disc space-y-2 pl-5">
          <li>Usar Comandapp para actividades ilegales o para vender cosas que no puedes vender.</li>
          <li>Cargar datos personales de terceros sin tener derecho a hacerlo.</li>
          <li>Intentar entrar a los datos de otro negocio, o poner a prueba la seguridad del servicio sin permiso escrito.</li>
          <li>Revender el servicio como si fuera tuyo.</li>
        </ul>
        <p>Si pasa algo de esto, podemos suspender la cuenta. Cuando se pueda, avisamos antes.</p>
      </Apartado>

      <Apartado titulo="Lo que no prometemos">
        <p>
          El servicio se presta <b>tal como está</b>. Hacemos lo posible por que esté siempre disponible, pero no garantizamos que nunca se caiga ni que esté
          libre de errores: depende también de tu internet y de proveedores que no controlamos. <b>Ten siempre un plan B en papel</b> para un apagón o una caída
          de internet; es un consejo operativo, no letra pequeña.
        </p>
        <p>
          No respondemos por lucro cesante ni por daños indirectos derivados del uso del servicio. Nada de esto limita los derechos que la ley colombiana te
          reconoce como consumidor y que no se pueden renunciar por contrato.
        </p>
      </Apartado>

      <Apartado titulo="Si te quieres ir">
        <p>
          Puedes dejar de usarlo cuando quieras. Antes, <b>exporta tus pedidos a Excel</b> desde el panel. Pídenos borrar la cuenta y eliminamos los datos como
          se explica en la <Link href="/privacidad" className="underline">política de privacidad</Link>. Nosotros también podemos dejar de prestar el servicio,
          avisando con un mes de anticipación y dándote tiempo de sacar tu información.
        </p>
      </Apartado>

      <Apartado titulo="Propiedad">
        <p>
          El código, el nombre y el diseño de Comandapp son de su autor. Tu menú, tus productos, tu logo y tus pedidos siguen siendo tuyos: nos das permiso
          únicamente para almacenarlos y mostrarlos dentro de la aplicación mientras uses el servicio.
        </p>
      </Apartado>

      <Apartado titulo="Cambios y ley aplicable">
        <p>
          Si estas condiciones cambian, actualizamos la fecha de arriba y avisamos dentro de la aplicación cuando el cambio sea importante. Se rigen por las
          leyes de la República de Colombia.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
