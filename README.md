# Unutulmuş Mühür Mahzeni

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

Minimap üzerinden ilerle ve yön değiştir. Meşale, baktığın yöndeki görüşünü
genişletir; yanarken gizlenemezsin. Görüş alanına giren yakındaki düşmanlarla
savaşabilir veya meşaleyi söndürüp gizlice uzaklaşmayı deneyebilirsin.
Başlangıç odasındaki eski haritayı alarak dungeon planını inceleyebilirsin.

## Kontrolleri doğrulama

```powershell
node test_game.js
node test_navigation.js
node test_progression.js
node test_escape.js
node test_loot_staff.js
node test_old_map.js
node test_torch.js
```
