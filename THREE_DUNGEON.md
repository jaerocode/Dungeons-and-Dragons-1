# Low-poly Three.js zindanı

Kamera güneyden düz bakar: kuzey ekranın üstü, doğu sağıdır. W ↑, A ←, S ↓, D → yönleri haritayla hizalıdır.

Three.js 0.186.1, `vendor/three.min.js` olarak yerel paketlenir. MIT lisansı `vendor/THREE-LICENSE.txt` dosyasındadır. Her iki HTML sürümü kütüphaneyi ve 3D çiziciyi içerir; oyun açılırken CDN, npm, sunucu veya internet bağlantısı gerekmez.

`three-dungeon.js`, ortografik kamerayla gerçek WebGL sahnesi oluşturur. Taş örgülü duvarlar, parçalı döşemeler, alçak ön duvarlar, meşale ışıkları, gölgeler, kapı kemerleri ve oda türüne göre moloz, sandık, varil, tezgâh, su ve lav detayları yerel geometriden üretilir. Karakter, silahlar ve düşmanlar da low-poly modellerdir. Sağdaki oda resmi ve ayrı savaş arayüzü korunur.

Hareket kareli, sıra tabanlı oyun kurallarını kullanır. Karakterin adımları görsel olarak yumuşatılır. WASD ilk basışta yön değiştirir; tekrar basınca ilerler. Fareyle yakındaki görünen zemin, eşya veya kapı seçilebilir. Raycaster zemin ve etkileşimli 3D modelleri aynı oyun bloğuna bağlar; kapının üst kemerine tıklamak da çalışır. Kamera + / − / ↺ düğmeleri ve fare tekerleğiyle ayarlanır.

Gölgede oda geometrisi seçilir, fakat düşman ve ganimet modelleri görüşe girene kadar oluşturulmaz. İlk odadaki eski harita istisnası korunur. Tuzak plakalarında %4,5 ton farkı vardır; ikon ya da gizli tuzağı açık eden açıklama bulunmaz. Moloz engelleri gerçek çarpışma bloklarıdır; dekoratif tezgâhlar ve variller geçişi engellemez.

Geliştirme:
```
npm ci
npm run build
npm test
npm start
```
Hazır oyun dosyalarını açmak için bu komutlar gerekmez. `node build_game.js`, depodaki hazır yerel kütüphaneyi kullanarak HTML dosyalarını yeniden oluşturabilir. `node build_three.js`, npm bağımlılıkları kuruluysa Three.js paketini yeniler.

WebGL kullanılamıyorsa mevcut izometrik SVG görünümü erişilebilir yedek olarak kalır. 3D sahne kaynakları oda değişiminde temizlenir; yeniden boyutlandırma kamerayı ayarlar ve tek WebGL context kullanılır.

Doğrulama: `test_three.js` gerçek Three.js geometrisini 13 odada kurar, kamera yerleşimini ve ışık dışındaki düşmanların oluşturulmamasını denetler, projeksiyondan raycast ile doğru bloğu seçmeyi test eder. Diğer oyun ve geçiş testleri korunur.

API kaynakları: https://threejs.org/docs/#OrthographicCamera ve https://threejs.org/docs/#Raycaster
