import Link from "next/link";
import type { Metadata } from "next";
import { Apartado, PaginaLegal } from "@/components/landing/PaginaLegal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos guarda Comandapp, para qué los usa, con quién los comparte y cómo pedir que los borremos.",
  alternates: { canonical: "/privacidad" },
};

export default function PaginaPrivacidad() {
  return (
    <PaginaLegal titulo="Política de privacidad" actualizado="22 de septiembre de 2026">
      <p>
        Comandapp es un sistema de comandas para negocios de comida. Esta página explica, sin rodeos, qué datos guardamos, para qué, con quién los compartimos y
        cómo pedir que los borremos. Si algo no queda claro, escríbenos: preferimos explicarlo a que te quedes con la duda.
      </p>

      <Apartado titulo="Quién responde por tus datos">
        <p>
          Comandapp lo desarrolla y opera <b>Daniel Pinzón (Inge Pinzón)</b>, en Colombia. Es el responsable del tratamiento de los datos personales que se
          manejan aquí, en los términos de la Ley 1581 de 2012 y sus normas reglamentarias.
        </p>
      </Apartado>

      <Apartado titulo="Qué datos guardamos">
        <p>Hay tres grupos distintos, y conviene no mezclarlos:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <b>De quien crea la cuenta.</b> Correo electrónico y contraseña (la contraseña la guarda cifrada el proveedor de autenticación; nosotros nunca la
            vemos). Si entras con Google, recibimos tu correo, tu nombre y tu foto de perfil.
          </li>
          <li>
            <b>Del negocio.</b> Nombre, dirección de WhatsApp para avisar a los clientes, logotipo si lo subes, el menú con sus productos y precios, y los
            cargos que cobras. Además, el nombre y el PIN de cada empleado: <b>el PIN se guarda cifrado</b> y no se puede leer, ni por nosotros.
          </li>
          <li>
            <b>De los clientes del negocio.</b> El nombre y el teléfono que el personal escribe al tomar un pedido, junto con lo que se pidió, la hora y el
            total. <b>Estos datos los aporta el negocio, no el cliente final</b>: el negocio es quien responde ante su cliente por haberlos recogido, y nosotros
            los tratamos por encargo suyo para poder prestarle el servicio.
          </li>
        </ul>
        <p>
          No pedimos ni guardamos datos de tarjetas, cédulas ni cuentas bancarias. El «método de pago» de un pedido es apenas una palabra —efectivo, Bre-B—, no
          un dato financiero.
        </p>
      </Apartado>

      <Apartado titulo="Para qué los usamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>Prestar el servicio: mostrar la cola de pedidos, calcular totales, armar el panel de ventas del dueño.</li>
          <li>Que el dueño pueda revisar su historial cuando un cliente reclama.</li>
          <li>Avisarte de cambios importantes del servicio, incluido el día en que dejemos de ser gratis.</li>
        </ul>
        <p>
          <b>No vendemos datos, no los cedemos a terceros para publicidad y no hay rastreadores publicitarios en la aplicación.</b> Tampoco usamos los datos de
          un negocio para nada que no sea prestarle el servicio a ese negocio.
        </p>
      </Apartado>

      <Apartado titulo="Con quién los compartimos">
        <p>Solo con los proveedores que hacen funcionar la aplicación, y cada uno con su parte:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <b>Supabase</b> (sobre infraestructura de Amazon Web Services): guarda la base de datos, las cuentas y los archivos que subes.
          </li>
          <li>
            <b>Vercel</b>: sirve la aplicación en internet.
          </li>
          <li>
            <b>Google</b>: si entras con tu cuenta de Google, para identificarte. Y si usas <b>importar el menú desde una foto</b>, esa imagen se envía al
            servicio de inteligencia artificial de Google (Gemini) para leer los productos y precios. Es el único momento en que una imagen tuya sale hacia un
            servicio de IA, y ocurre porque tú lo pides.
          </li>
        </ul>
        <p>
          Los mensajes de WhatsApp a tus clientes <b>no los enviamos nosotros</b>: Comandapp arma el texto y abre WhatsApp en tu dispositivo para que lo mandes
          tú, desde tu propia línea.
        </p>
      </Apartado>

      <Apartado titulo="Cookies">
        <p>
          Usamos únicamente cookies técnicas: la de tu sesión iniciada y dos que recuerdan qué negocio y qué empleado está usando la tablet. Sin ellas
          tendrías que identificarte en cada pantalla. <b>No usamos cookies de publicidad ni de analítica de terceros.</b>
        </p>
      </Apartado>

      <Apartado titulo="Cuánto tiempo los guardamos">
        <p>
          Mientras la cuenta exista. Los pedidos se conservan como historial del negocio —es justamente para lo que sirven— y se borran cuando el negocio lo
          pide o cuando cierra su cuenta. Si nos pides borrar la cuenta, eliminamos los datos del negocio y de sus clientes; puede quedar algún registro en las
          copias de seguridad de nuestros proveedores por un tiempo limitado, hasta que esas copias rotan.
        </p>
      </Apartado>

      <Apartado titulo="Tus derechos">
        <p>
          Puedes pedirnos <b>conocer, actualizar, rectificar o suprimir</b> tus datos, y revocar la autorización para tratarlos. Escríbenos por WhatsApp al
          número de abajo y te respondemos; si el trámite exige comprobar quién eres, te lo pediremos antes de hacer cambios. Si eres cliente de un restaurante
          que usa Comandapp y quieres que borren tu nombre y tu teléfono, puedes pedírselo directamente al restaurante o a nosotros, y lo coordinamos con él.
        </p>
      </Apartado>

      <Apartado titulo="Seguridad">
        <p>
          Cada negocio solo ve lo suyo: la base de datos tiene reglas que separan la información por negocio, no es una cortina en la pantalla. Las
          contraseñas y los PIN van cifrados. Aun así, ningún sistema es infalible: si llegara a ocurrir un incidente que afecte tus datos, te avisaremos.
        </p>
        <p>
          Un consejo práctico que también es tuyo: la tablet del local queda con la sesión abierta y los empleados entran con PIN. <b>No dejes esa tablet fuera
          del local con la sesión abierta.</b>
        </p>
      </Apartado>

      <Apartado titulo="Menores de edad">
        <p>Comandapp es una herramienta de trabajo. No está dirigida a menores de edad y no recogemos datos de ellos a sabiendas.</p>
      </Apartado>

      <Apartado titulo="Cambios">
        <p>
          Si esto cambia, actualizamos la fecha de arriba y te avisamos dentro de la aplicación cuando el cambio sea importante. Las{" "}
          <Link href="/terminos" className="underline">condiciones del servicio</Link> van aparte.
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
