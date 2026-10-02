# Mines of Moria — sahne üzerinden oda keşfi

Oyuncu Doğu Kapısı Hücreleri’nde isim ve sınıf seçerek başlar. Sahnedeki kapı düğmeleri doğrudan hedef odaya götürür; koridor ekranı ve minimap kaldırılmıştır. Ana oyun ekranı pencere yüksekliğine sığar. Aksiyonlar görselin alt kenarında, kapılar resimdeki geçitlerin üzerinde, ganimet belirgin bir sahne düğmesindedir. Uzun açıklamalar, kayıtlar ve etkileşimler “Odayı incele” penceresinde okunur. Küçük ekranda karakter paneli yatay özet olur; envanterin tamamı Bohça penceresinden açılır.

## Oda kadrosu

13 oda ayrı sahne görseli, atmosfer açıklaması, inceleme metni ve ikişer okunabilir kayıt içerir. Hücreler, Üç Kapı Avlusu, İşkence Odası, Kara Demir Cephaneliği, Katakomblar, Yasak Simya Odası, Başbüyücünün Arşivi, Sular Altındaki Zindan, Rünlü Kapı Odası, Gümüş Mühür Hazinesi, Kemik Bekçisinin Salonu, Mithril Deposu ve Lav Damarları Salonu bulunur.

“Odayı incele” ayrıntıları, okuma düğmelerini ve oda etkileşimlerini açar. Simya odasında INT 11 kontrolüyle bir kere iyileştirme iksiri hazırlanabilir; başarısız deneme ilerlemeyi kilitlemez. Hücrede bir defalık 4 can temizlenmesi, arşivde bir defalık 2 Focus yenilenmesi vardır. Mühür odasındaki taş bank tek sefer tam can ve Focus verir.

Kapı düğmeleri resimdeki kapıların üzerinde hedef oda adını gösterir. Her odanın kapı koordinatları dungeon_map.json içindeki door_hotspots alanında bulunur. Sınıfa özel yan geçitler korunur; Mage ilk açılışta 1 Focus, Fighter duvar kırarken alarm bedeli öder. Açılmış geçitler dönüşte yeniden bedel istemez. Her sınıf için ortak final yolu vardır.

## Sessizlik veya combat

Bir odaya girmek otomatik savaş başlatmaz. Düşmanlı odada oyuncu “Sessizce ilerle” veya “Silahını çek / combat’a gir” seçer. Düşmanlar aşılmadan oda kapıları ve ganimetleri kullanılamaz. Başarılı gizlilik mevcut ziyaret boyunca kapıları ve ganimetleri açar; düşmanın canı ve odası korunur. Odaya geri dönmek yeniden karşılaşma seçimi gerektirir.

Gizlilik bonusu DEX değiştiricisi + sınıf gizlilik değiştiricisi + Rogue için 4 + ekipman bonuslarıdır. DC Fighter 18, Mage 15, Rogue 11; trol salonu +3, muhafız +2. Doğal 1 başarısız, doğal 20 başarılıdır. Ekipmansız sıradan karşılaşmada Fighter %15, Rogue %90 başarı olasılığına sahiptir. Bunlar zar hesabıdır; oyuncu deneyimiyle tamamlanmış denge değerlendirmesi değildir.

Trol 65 HP, 15 AC, +6 isabet ve 2d6+4 hasarla güçlüdür. Salonun duvarlarından lav akar, zemindeki kanallar ve bazalt sütunlar yan galerilerde gizli geçiş için anlatısal örtü sağlar. Kare bazında sütun hareketi artık kullanılmaz. Trolü öldürmek zorunlu değildir.

Savaş başında gizli d20 inisiyatif atılır. Oyuncu DEX değiştiricisi ve hazır silah/büyü için +2 alır. Beraberlikte oyuncu başlar. Oyuncu turu 3 aksiyon: saldırı, hazırlık, iksir, ekipman kuşanma veya kaçış denemesi birer hak tüketir. Tur erken bitirilebilir. Her düşman kendi turunda bir saldırı yapar.

İsabet toplamı hedef AC’sinden büyük olmalıdır; eşitlik ıskadır. Düşman isabetten sonra hasar zarını atar. Canı ekranda daima “?”; yaralı/ağır yaralı ipuçları gösterilir. Kaçış penceresi bir çıkış kapısı seçtirir. Başarılı DEX kontrolü doğrudan seçilen odaya götürür; başarısızlık 1 hak tüketir ve düşman kaçışı bloklar. Kilitli veya sınıfa uygun olmayan kapıya kaçılmaz. Düşman canı sıfırlanmaz.

Hasar alındığında oyun yüzeyi kısa süre titrer ve kırmızı darbe efekti görünür. Azaltılmış hareket tercihi titremeyi kaldırır. Ölümde tam ekran kızıl “ÖLDÜN.” penceresi gelir. Yeniden başla aynı isim/sınıfla temiz macera ve başka bilmece oluşturur. Çık, maceradan ayrılma ekranına döner; tarayıcı sekmesini kapatmaz.

## Rünlü kapı

Güneş/ay/yıldız sırası kaldırıldı. Dört klasik bilmece Türkçeye uyarlanmıştır; her yeni macerada bir tanesi seçilir. Aynı macerada kapıyı yeniden açmak soruyu değiştirmez. Aynı tarayıcıdaki son bilmece localStorage’da saklanır; sonraki macera onu dışlayarak seçim yapar. Depolama kullanılamazsa yeni seçim rastgeledir.

Bilmece ayrı pencerede dört şık ve isteğe bağlı ipucu gösterir. Yanlış cevap alarmı artırır ve yeniden denemeye izin verir. Doğru cevap kapıyı açar. Kaynaklar: [British Council](https://learnenglishkids.britishcouncil.org/fun-games/riddles/cities-no-houses) ve [ABCmouse klasik bilmece listesi](https://www.abcmouse.com/learn/wp-content/uploads/2024/08/ABCmouse-Easy-Riddles-for-Kids-with-Answers.pdf). Kaynak adresi her bilmece kaydında ve oyun penceresinde bulunur; oda hikâyeleri özgün yazımdır.

## Envanter ve görev

Başlangıçta yalnızca sınıfın silahı/büyüsü vardır, iksir yoktur. Sol alttaki envanter toplanan eşyaları gösterir. Ganimet toplanınca eşya görselleriyle bir pencere açılır. Bir odanın ganimeti yalnızca bir kez alınır; düşman öldürmek kendiliğinden eşya eklemez.

Gölge Pelerini +2 gizlilik, Kül Zırhı +2 AC, Kara Demir Kılıç +2 fiziksel hasar verir. Cephanelikte ayrıca Fighter için Külbiçen +4 hasar, Rogue için Fısıltı Hançeri +3 hasar/+1 gizlilik, Mage için Gece Rünü Asası +2 büyü hasarı bulunur. Aynı ekipman slotunun bonusları üst üste eklenmez. İyileştirme İksiri 8 can, Odak İksiri 3 Focus yeniler. Öfke İksiri bir aksiyon tüketir ve o oyuncu turunda kalan saldırılara +3 hasar verir; tur sonunda veya kaçışta silinir.

Mithril Külçesi yalnızca son Mithril Deposu’ndedir. Sahnedeki taşı al düğmesiyle toplanır; resim boş kaideye dönüşür. Oyuncu kapılardan Doğu Kapısı Hücreleri’ne dönünce dış kapı açılır ve macera tamamlanır.

## Dosyalar ve doğrulama

- dungeon_map.json: odalar, kapı bağlantıları/koordinatları, okumalar, etkileşimler ve dört bilmece.
- game_rules.json, bestiary.json, loot.json: sınıflar, düşmanlar ve eşyalar.
- game-engine.js: doğrudan oda geçişleri, karşılaşma, combat, ganimet ve görev.
- game-ui.js, game.template.html, game.css: görseller, sahne düğmeleri, tek ekran yerleşimi ve pencereler.
- assets/SIMPLE_ART_PROMPTS.md: sade oda resimlerinin yerleşik ImageGen promptları ve kayıt yolları. Moblar enemy_art resimlerinde doğrudan ortamla birlikte çizilir; ayrıca PNG mob katmanı kullanılmaz. Düşman ölünce temiz oda görseli gösterilir.
- assets/ROOM_ART_PROMPTS.md: önceki ayrıntılı oda resimlerinin üretim kaydı.
- assets/ART_PROMPTS.md: önceki düşman ve hazne görsellerinin üretim kaydı.

node build_game.js bağımsız game.html ile küçük LAN dosyası game.web.html üretir. node server.js 8080 portunda game.web.html ve yalnızca assets içindeki PNG resimleri sunar. HTML no-store, resimler bir saat önbelleklidir. game.html doğrudan dosya olarak da açılabilir. LAN sürümü bütün resimleri ilk açılışta indirmez.

Güncel hareket ve silah kuralları NAVIGATION_AND_WEAPONS.md içinde açıklanır: oda hareketi minimap bloklarıyla yönetilir, kapıya yaklaşınca çıkış açılır; yalnızca tek silah taşınır. Yeni silah alınırken eskisi yerde kalır. Çekiç 2 AP tüketir.

node test_game.js oda etkileşimlerini, dört bilmeceyi, sınıf gizlilik olasılıklarını, combat ve UI ölüm/yeniden başlatmayı doğrular. node test_progression.js ekipman, ganimet ve tur etkilerini test eder. node test_escape.js yön seçerek bloklara kaçmayı, düşmanın canını, geri dönüş karşılaşmasını ve critical fail durumunu doğrular. node test_navigation.js üç sınıfı gerçek blok hareketleriyle hedefe ulaştırıp geri döndürür; duvarları, hızlı hareketin düşmanı uyarmasını, tek silah değişimini ve çekicin AP kurallarını test eder. node build_dungeon.js tasarım haritasını ve bütün sınıfların hedef erişimini kontrol eder.

