ANCHR v13 - Supabase

Archivos importantes:
- anchr_app/index.html
- anchr_app/styles.css
- anchr_app/app.js
- supabase_schema.sql

Antes de publicar:
1. Crea o abre tu proyecto en Supabase.
2. Ve a SQL Editor y ejecuta supabase_schema.sql.
3. Ve a Project Settings > API.
4. Copia Project URL y anon public key.
5. En anchr_app/app.js reemplaza:
   SUPABASE_URL = 'PEGA_AQUI_TU_SUPABASE_URL'
   SUPABASE_ANON_KEY = 'PEGA_AQUI_TU_SUPABASE_ANON_KEY'
6. En Authentication > URL Configuration agrega tu URL:
   https://anchr.oaxsun.tech
7. Si usaras Google Login, configuralo en Authentication > Providers > Google.

Notas:
- Los pagos ya no se guardan en localStorage.
- Cada usuario ve solo sus propios pagos gracias a RLS.
- La app crea/edita/elimina pagos en la tabla payments.
- Al registrar un pago se actualiza payments y se guarda un registro en payment_history.
