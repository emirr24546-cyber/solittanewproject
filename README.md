# 🚀 Discord Tools - Render & Vercel Dağıtım Kılavuzu (Deployment Guide)

Bu proje, bir **Full-Stack (Vite + React + Express + Node.js)** uygulamasıdır. Arka planda gerçek zamanlı Discord API isteklerini yönlendiren, oturumları ve yetkileri yöneten bir Node.js/Express sunucusu yer alır.

---

## ❌ Neden Vercel'de Çalışmadı? (Giriş Yapınca Web Neden Gelmiyor?)

1. **Sunucu Bağımlılığı (Server Lifecycle):** Vercel, statik siteler (SPA) veya Serverless fonksiyonlar için tasarlanmıştır. Bu projede kullanılan aktif Express sunucusunu (`server.ts` ve `app.listen`) sürekli çalışır halde tutamaz.
2. **Yazılabilir Dosya Sistemi (Local database.json):** Proje, VIP üyeleri, kayıtlı referans kodlarını ve ayarları yerel bir JSON veritabanında (`database.json`) saklar. Vercel'in dosya sistemi **salt okunurdur (read-only)** ve geçicidir. Bu nedenle veri kaydedilemez, girişler ve yetki kontrolleri `/api/auth/login` aşamasında hata verir veya çöker.

---

## 👑 Projeyi Render'da Canlıya Nasıl Alırsınız? (Adımlı Kılavuz)

**Render**, bu tür Express sunuculu full-stack projeleri çalıştırmak için en ideal, stabil ve **ücretsiz** platformdur.

Aşağıdaki adımları sırasıyla uygulayarak projenizi Render üzerinde saniyeler içinde yayına alabilirsiniz:

### Adım 1: GitHub'a Yükleyin
Projeyi yerel bilgisayarınıza indirin (Settings panelinden ZIP olarak dışa aktarabilirsiniz) veya GitHub entegrasyonu ile kendi GitHub hesabınızda bir repository olarak paylaşın.

### Adım 2: Render Hesabı Açın ve Giriş Yapın
1. [Render.com](https://render.com/) adresine gidin.
2. GitHub hesabınız ile kolayca giriş yapın/kaydolun.

### Adım 3: Yeni Bir "Web Service" Oluşturun
1. Render paneline girin ve sağ üstteki **"New +"** butonuna tıklayıp **"Web Service"** seçeneğini seçin.
2. **"Build and deploy from a Git repository"** seçeneğini seçip devam edin.
3. Projenizin bulunduğu GitHub deposunu (repository) listeden bulup **"Connect"** butonuna basın.

### Adım 4: Dağıtım Ayarlarını Yapılandırın (Çok Önemli ⚠️)
Açılan ayar ekranında aşağıdaki bilgileri **birebir aynı** olacak şekilde doldurun:

*   **Name:** `discord-tools` (veya dilediğiniz bir isim)
*   **Region:** En yakın konumu seçin (örneğin *Frankfurt - EU*)
*   **Branch:** `main` (veya kodunuzun bulunduğu ana branch)
*   **Root Directory:** Boş bırakın (veya `/`)
*   **Runtime:** `Node`
*   **Build Command:** 
    ```bash
    npm install && npm run build
    ```
*   **Start Command:** 
    ```bash
    npm run start
    ```
*   **Instance Type:** **Free** (Ücretsiz Paket)

### Adım 5: Ortam Değişkenini Tanımlayın (Environment Variables)
Sayfanın altındaki **"Advanced"** bölümünü genişletin veya **"Environment Variables"** sekmesine gidin. Aşağıdaki değişkeni ekleyin:

| Key | Value | Açıklama |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Projenin üretim modunda optimize çalışması ve derlenmiş dosyaları sunması için gereklidir. |
| `ADMIN_PASSWORD` | *Kendi Şifreniz* (Örn: `emir546`) | Yönetici paneline girerken kullanacağınız özel şifre. |

### Adım 6: Canlıya Alın! 🚀
En alttaki **"Deploy Web Service"** butonuna tıklayın. 
Render, önce bağımlılıkları yükleyecek (`npm install`), ardından projeyi derleyecek (`npm run build`) ve otomatik olarak Express sunucusunu ayağa kaldıracaktır (`npm run start`).

Birkaç dakika içinde size özel `https://proje-adi.onrender.com` şeklinde bir bağlantı üretecektir. Artık web siteniz dünyanın her yerinden kesintisiz olarak çalışacaktır!
