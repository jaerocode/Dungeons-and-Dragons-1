# Moria Madenleri

Fighter, Mage veya Rogue ile oynanan, sıra tabanlı bir dungeon macerası.
Mühür Taşı'nı bul ve başlangıçtaki zindanlardan kaç.

## İndir ve oyna (kurulum gerekmez)

GitHub'da **Code → Download ZIP** seçeneğiyle projeyi indir ve ZIP'i çıkar.
`game.html` dosyasını Chrome, Edge veya Firefox ile aç. Görseller bu dosyanın
içindedir; Node.js ve ayrı bir sunucu kurmadan oynayabilirsin.

Yalnızca `game.html` dosyasını da GitHub'daki dosya sayfasının indirme
düğmesinden indirebilirsin. Dosya yaklaşık 56 MB olduğu için GitHub önizlemesi
açılmayabilir; dosyayı indirip bilgisayarında aç.

Özel (Private) depoları yalnızca erişim izni olan kullanıcılar indirebilir.
Herkesin erişebilmesi için depo Public olmalıdır.

## Localhost ile çalıştırma ve geliştirme

Bilgisayarında Node.js kurulu olmalı. Proje klasöründe:

```powershell
node build_game.js
node server.js
```

Tarayıcıda http://localhost:8080/ adresini aç.
Aynı yerel ağdaki diğer cihazlar bilgisayarın yerel IP adresi üzerinden
8080 portuna bağlanabilir.

Görseller `assets1` ve `assets2` klasörlerinde bulunur; iki klasör de gereklidir.
`game.html` ve `game.web.html` hazır sürümler olarak depoda bulunur;
derleme sırasında en güncel kaynaklardan yeniden oluşturulur.

## Dosya boyutları

Görseller `assets1` ve `assets2` klasörlerinde toplam yaklaşık 42 MB'tır;
her görsel 3 MB'tan küçüktür. Hazır `game.html` yaklaşık 56 MB'tır.
GitHub web yükleyicisindeki 25 MiB dosya sınırı nedeniyle güncellemeleri
Git veya GitHub Desktop ile push etmek gerekir. Normal Git'in tek dosya
sınırı 100 MiB'tır. Bu proje mevcut boyutlarıyla Git LFS gerektirmez.

## Kontroller

Minimap veya klavye üzerinden ilerle: W kuzey, A batı, S güney, D doğu.
İlk basış o yöne döndürür; aynı yöne tekrar basınca bir blok ilerlersin.
Yakındaki kapı ikonuna tıklayarak diğer odaya geçebilirsin.
Pencereler açıkken ve combat sırasında bu hareket tuşları çalışmaz.
Meşale, baktığın yöndeki görüşünü
genişletir; yanarken gizlenemezsin. Meşalenin aydınlattığı düşman için
resimli bir karşılaşma penceresi açılır: saldır veya meşaleyi söndürüp
gizlice kaçmayı dene. Düşmanın merkezindeki 3×3 alana girmek savaşı
otomatik başlatır; başarılı gizlilik bu yakınlık kontrolünden korur.
Görünmeyen düşmanların varlığını sesler haber verir. Görüş alanındaki
ganimetler minimap'te mavi eşya ikonlarıyla görünür. Yakındaki ikona
tıklayarak al; uzaktakilerde “Yaklaşman lazım” yazar. Mektupları ve
kayıtları loot olarak toplayıp envanterden okuyabilirsin.
Başlangıç odasındaki eski haritayı alarak dungeon planını inceleyebilirsin.
Başlangıç haritası bakış yönünden bağımsız görünür. Karşılaşma
penceresi yaratığı oda sahnesinde gösterir; başarısız gizlilik, engellenen
kaçış ve yakınlık nedeniyle başlayan savaş ayrı sonuç penceresiyle bildirilir.
Bu pencere açıkken düşman turu bekler; Devam et ile sürer.

## Kontrolleri doğrulama

```powershell
node test_game.js
node test_navigation.js
node test_progression.js
node test_escape.js
node test_loot_staff.js
node test_old_map.js
node test_torch.js
node test_exploration_controls.js
node test_encounters.js
```

Karakter seçiminde sınıfa göre kask, kapüşon, maske ve kıyafet renkleri;
Mage için sakal seçimi bulunur. Keşifte solda büyük minimap, sağda oda
görseli ve etkileşimler vardır. Savaşta düşman solda, savaş günlüğü ve
aksiyonlar sağda ayrı bir düzende gösterilir.
