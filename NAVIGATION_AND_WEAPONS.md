# Minimap ve tek silah kuralı

Oda resimleri atmosfer için kalır. Hareket, sağ üstteki 7 × 7 yerel minimap ile yönetilir. Komşu boş bloğa tıklamak 1 blok ilerletir. İleri/geri 1 blok; hızlı git 3 blok ilerletir. Sola/sağa dön, karakterin yönünü ve aydınlatılan görüş konisini değiştirir. Duvarlar ve bazalt sütunlar geçilemez. Kapı hücresinin en fazla 1 blok yakınında `Odadan çık` açılır; sınıf ve bilmece kilitleri geçerlidir. Koridor resmi yoktur.

Düşmanlar aynı odada kalır, ölenler minimap’ten çıkar. Yalnızca baktığın yöndeki görüş konisi görünür; yanlar ve arka taraf, düşmanları ve ganimetleriyle birlikte gizlenir. Meşale sönükken koni 1 blok, yanarken 3 blok ileri uzanır. İlk kez görülen düşmanın yakınında savaş veya gizlilik seçilebilir; hızlı hareket 3 blok yakınındaki düşmanı uyarır. Başarılı gizlilik oda boyunca algılanmayı önler. Combat öncesi hazırlık inisiyatife +2 verir.

Kaçışta yön seçilir. Başarılı DEX kontrolü aynı odada en fazla 3 blok uzaklaştırır. Yol bir düşman bloğundan geçiyorsa critical fail olur ve 1 aksiyon harcanır. Duvara/sütuna tamamen kapalı yönde deneme yapılmaz. Kaçılan düşmanın canı ve konumu korunur; yeniden yaklaşmak savaşı tekrar başlatır.

Başlangıç silahı dahil yalnızca 1 silah taşınır. Silahlar ganimet toplarken otomatik olarak bohçaya eklenmez. Ganimet penceresinde birini seçmek eldeki silahı aynı odada yere bırakıp yenisini alır. Bırakılan silah geri dönüldüğünde tekrar alınabilir. Silah değiştirmek hazırlığı kaldırır; tekrar çekmek gerekir. Zırh, pelerin, iksir ve görev eşyaları normal şekilde taşınır.

| Silah | Hasar | Aksiyon | Sınıf |
| --- | --- | --- | --- |
| Köz Baltası | 1d10 + STR +2 | 1 | Fighter, Rogue |
| Bazalt Savaş Çekici | 3d8 + STR +3 | 2 | Fighter |
| Kara Demir Gürz | 1d8 + STR +3 | 1 | Fighter, Rogue |
| Kül Uçlu Mızrak | 1d8 + DEX +2 | 1 | Fighter, Rogue |

Çekiç ıskaladığında da 2 aksiyon tüketir. Yalnızca 1 aksiyon kalmışsa saldırı engellenir; kaçış veya tur bitirme kullanılabilir. Eski kılıç, hançer ve asa seçenekleri de tek silah sınırına dahildir. Silah deposunda tüm yeni silahlar vardır; diğer odalarda da gürz, mızrak ve balta bulunur.

Doğrulama: `node test_navigation.js`, `node test_game.js`, `node test_progression.js`, `node test_escape.js`.

## Bloklarda ganimet ve asalar

Her eşya ayrı bir ganimet kaydı ve blok konumu taşır. Mavi ◆ minimap işareti, alınmamış eşyaları ve bırakılmış silahları gösterir. Eşyanın bloğuna en fazla 1 blok yaklaşınca `Al · Eşyanın adı` açılır. Eşyalar tek tek alınır. Silah seçimi penceresi yalnızca seçilen eşyayı gösterir; eskisi oyuncunun bulunduğu blokta kalır. Mühür Taşı da aynı yakınlık kuralıyla alınır. Minimap’te eşyanın üzerine gelmek adını gösterir.

Tüm sınıflar asaları taşıyabilir. Fighter ve Rogue asayla 1d4 + STR yakın dövüş hasarı verir, 1 aksiyon tüketir; büyü etkisi ve büyülü hasar bonusu uygulanmaz. Mage INT kullanır:

| Asa | Mage etkisi | Aksiyon |
| --- | --- | --- |
| Gece Rünü Asası | Normal büyü hasarına +2 | 1 |
| Şimşek Asası | 1d10 + INT; hedefin 2 AC puanını yok sayar | 1 |
| Buz Asası | 1d8 + INT; hedefin bir sonraki saldırısına -2 isabet | 1 |
| Ateş Topu Asası | 2d8 + INT; hedefin sonraki turunun başında 2 yanma hasarı | 2 |

Etkiler yalnızca isabet sonrası uygulanır. Buz bir düşman saldırısından sonra, yanma bir kez hasar verdikten sonra biter; kendi içinde birikmez. Yanma düşmanı öldürürse düşman saldırmaz ve oda temizlenir. Asalar Cephanelik’te, Buz Asası Simya Odası’nda, Şimşek/Ateş Topu Asaları Arşiv’de bulunur. `node test_loot_staff.js` yakınlık, tekil toplama, bırakılan silahın konumu ve sınıflara göre asa etkilerini doğrular.
# Meşale ve keşif

Başlangıçta sönük bir meşale taşınır. Envanterdeki meşaleye veya aksiyon düğmesine basarak yakılır/söndürülür. Yalnızca baktığın yöndeki koni görünür: sönükken 1 blok, yanarken 3 blok ileri uzanır ve mesafeyle genişler; duvar ve sütunlar görüşü keser. Meşale yanarken gizlenme yapılamaz ve önceki gizlilik sona erer. Combat sırasında meşaleyi değiştirmek 1 aksiyon harcar; eşya tükenmez.

Düşmanlar oda girişinde gösterilmez. İlk kez görüş alanında düşmanın 3×3 yakın alanına girince sessizce uzaklaşma veya combat seçenekleri açılır. Yavaş yaklaşma kendi başına combat başlatmaz. Hızlı adımlar 3 blok yakınındaki düşmanı uyarır; uyarılmış düşmanın 3×3 alanına girmek veya düşmanın bloğuna basmak combat başlatır. Görüş dışında düşman işareti, kartı ve düşmanlı oda görseli gizlenir.
