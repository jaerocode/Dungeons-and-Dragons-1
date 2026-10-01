# Unutulmuş Mühür Mahzeni

Fighter, Mage veya Rogue ile oynanan, sıra tabanlı bir dungeon macerası.
Mühür Taşı'nı bul ve başlangıçtaki zindanlardan kaç.

## Çalıştırma

Bilgisayarında Node.js kurulu olmalı. Proje klasöründe:

```powershell
node build_game.js
node server.js
```

Tarayıcıda http://localhost:8080/ adresini aç.
Aynı yerel ağdaki diğer cihazlar bilgisayarın yerel IP adresi üzerinden
8080 portuna bağlanabilir.

Görseller `assets1` ve `assets2` klasörlerinde bulunur; iki klasör de gereklidir.
`game.html` ve `game.web.html` derleme sırasında yeniden oluşturulur.

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
