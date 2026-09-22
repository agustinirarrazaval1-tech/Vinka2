# Cómo activar el control de stock (Firebase)

La página ya tiene todo programado. Solo falta crear el proyecto gratis en Firebase
y pegar sus datos en `firebase-config.js`. Se hace una sola vez y toma unos 10 minutos.

## 1. Crear el proyecto
1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. **Agregar proyecto** → nombre: `vinca` → puedes desactivar Google Analytics → **Crear**.

## 2. Activar el login
1. Menú izquierdo: **Compilación → Authentication → Comenzar**.
2. En **Método de acceso**, activa **Correo electrónico/contraseña** y guarda.
3. Pestaña **Usuarios → Agregar usuario**:
   - Correo: `vincatech@vinca.cl`
   - Contraseña: `ñañamargarita`

   En la página escribirás el usuario **Vincatech**; la página lo traduce a ese correo.
   (Si prefieres usar un correo tuyo real, cámbialo también en `firebase-config.js`
   y en `firestore.rules`.)

## 3. Crear la base de datos
1. Menú izquierdo: **Compilación → Firestore Database → Crear base de datos**.
2. Ubicación: `southamerica-east1` (São Paulo) → modo **producción** → **Crear**.
3. Pestaña **Reglas**: borra lo que hay, pega el contenido del archivo `firestore.rules`
   de este repositorio y presiona **Publicar**.

## 4. Conectar la página
1. Ícono de engranaje → **Configuración del proyecto** → sección **Tus apps** → ícono `</>` (Web).
2. Nombre: `vinca-web` → **Registrar app**.
3. Firebase muestra un bloque `const firebaseConfig = { ... }`. Copia esos valores
   en `firebase-config.js`, reemplazando los que dicen `PEGAR_...`.

## 5. Cuando tengas el dominio en Vercel
En Firebase: **Authentication → Configuración → Dominios autorizados → Agregar dominio**
y agrega tu dominio (por ejemplo `vinca.cl`) y también el `*.vercel.app` que te da Vercel.
Sin este paso el login no funciona en ese dominio.

## Uso diario
- Al final de la página, esquina inferior derecha, pincha **Te esperamos**.
- Entra con **Vincatech** / **ñañamargarita**.
- Verás cada mesa con su stock y el total de unidades. Usa − / + o escribe el número
  y presiona **Guardar**. Los clientes lo ven al instante.
- Si una mesa queda en 0, la página muestra "Agotado".
- Mientras no cargues ningún número, la página sigue mostrando "Disponibilidad: sujeto a stock".
