# ANCHR / Reminder

Version v18 conectada al proyecto Supabase `reminder`.

Supabase URL:
https://qjicwqpjxsqynoudwylk.supabase.co

Tablas usadas:
- payments
- payment_history

Despues de subir a GitHub Pages, abre DevTools > Console y confirma que aparezca:
ANCHR v18-reminder conectado a https://qjicwqpjxsqynoudwylk.supabase.co

Si sigues viendo otra URL de Supabase, GitHub Pages o el navegador estan cargando una version vieja. Haz hard refresh o espera a que termine el deploy.


## v20
- Corrige labels móviles por columna.
- Evita overflow horizontal del menú de edición en móvil.
- Restaura tabbar móvil visible.


## v21
- Corrige carga inicial de pagos al iniciar sesión o refrescar la app.
- Fuerza recarga segura desde Supabase en pageshow/visibilitychange.


## v24
Corrige la carga inicial con restauración de sesión y reintentos controlados.
