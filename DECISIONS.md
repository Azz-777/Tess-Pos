# Desiction

Bu fayl — loyihada nega shunday qilganimni oddiy qilib yozib qo'ygan joyim. Videoda shuni gapirib beraman.

## 1. Tenant va rol qanday yuradi

Odam login qilganda, men uning qaysi biznesga tegishliligini (tenant) va rolini (admin yoki kassir) token (JWT) ichiga solib qo'yaman. Client o'zidan "men falon biznesdanman" demaydi — faqat shu token bor. Har bir so'rovda token tekshiriladi, biznes faolmi qaraladi, keyin ruxsat beriladi.

Hamma yerda ma'lumot faqat token'dagi tenant bo'yicha olinadi — shuning uchun bir biznes ikkinchisining ma'lumotini ko'ra olmaydi. Qisqasi: token — ishonchning yagona manbasi.

## 2. N+1 va indeks (tezlik)

Avval mahsulotlar ro'yxatida har bir mahsulotning turkumini alohida so'rov bilan olardi: 1 ro'yxat + N ta qo'shimcha so'rov = sekin. Men buni bitta `$lookup` (aggregation) bilan yechdim — nechta mahsulot bo'lsa ham bitta so'rov.

Indeks: `{ tenantId, name }`. Avval `tenantId` qo'ydim, chunki har doim shu bo'yicha filtr bor (bitta biznesga qisqartiradi), keyin `name` — qidiruv ham, saralash ham shu bo'yicha. Tannarx (`costPrice`) esa `select:false` — oddiy so'rovlarda umuman chiqmaydi.

## 3. Client'ga nimaga ishonaman

Client'dan faqat **mahsulot id va soni**ni olaman, vaqtam. Narx, tannarx, qoldiq — hammasini serverda DB'dan qayta o'qiyman. Savatda ko'ringan narx faqat ko'rsatish uchun; buyurtma berilganda server o'zi haqiqiy narxni qo'yadi.

Shuning uchun kimdir client'da narxni o'zgartirib yuborsa ham hech narsa bo'lmaydi — do'konni aldab arzonga sotib ololmaydi. POS'da eng muhim joyi shu.

## 4. Oversell bo'lmasligi (ikki kassir bir vaqtda)

Buyurtma transaction ichida bo'ladi. Stokni shunday kamaytiraman: "agar `stock >= soni` bo'lsa, kamaytir". Bu shartni server atomik bajaradi, shuning uchun stok manfiyga ketolmaydi.

Ikki kassir oxirgi 1 donani bir vaqtda sotsa: birinchisi o'tadi (stok 0 bo'ladi), ikkinchisining sharti endi to'g'ri kelmaydi → uning buyurtmasi rad etiladi (409), DB esa o'zgarmay qoladi.

Qayerda buziladi: bu replica set'ni talab qiladi. Yana, agar kimdir stokni shu shartdan chetlab (masalan to'g'ridan-to'g'ri import bilan) o'zgartirsa, kafolat ishlamaydi.

## 5. Margin (foyda) qanday yashirilgan

Tannarx va foyda **data qatlamida** yashirilgan — `costPrice` va `unitCost` maydonlari `select:false`. Ya'ni kassir yetadigan hech bir so'rov ularni qaytarmaydi (React'da yashirish emas, eng pastda yopiq). Chek ham faqat kerakli maydonlardan yig'iladi, ichida cost degan narsa umuman yo'q.

Cost faqat admin hisobotida (aggregation) o'qiladi, u ham faqat admin uchun. Reviewer kassir token bilan API'ni tekshirsa — cost/margin chiqmaydi.

## 6. Webhook (to'lov) — takror kelsa ham bir marta

To'lov provayderi `POST /api/webhooks/payment` yuboradi. Avval **HMAC imzo** tekshiriladi (soxta bo'lsa 401). Keyin `eventId` unique — bir xil event necha marta kelsa ham faqat **bir marta** ta'sir qiladi.

Agar order hali yo'q bo'lsa (webhook erta kelsa) — 404 qaytaradi va hech narsa yozmaydi, keyin qayta kelganda ishlaydi. Boshqa biznesning order'i bo'lsa — "topilmadi" deydi, sizib ketmaydi.

## 7. Tenant yo'q yoki noma'lum bo'lsa

Agar token'da tenant bo'lmasa yoki noma'lum bo'lsa — so'rovni rad etaman (401). Sababi: "default biznes" degan narsa yo'q, noto'g'ri xizmat qilsam bir biznesning ma'lumoti boshqasiga sizib ketishi mumkin. Shuning uchun shubhada bo'lsa — yopaman (fail closed). Bu topshiriqdagi ataylab qo'yilgan noaniqlik edi, men buni payqab, shunday hal qildim.

## 8. Nimani birinchi qildim + bitta e'tiroz

Vaqt kam bo'lganda avval **pul va stok** to'g'riligini qildim: server narxi, oversell yo'qligi, margin yashirinligi. Keyin webhook, keyin kesh va UI. Demo uchun "to'lovni tasdiqlash" tugmasi qo'shdim (faqat dev uchun), asl yo'l esa imzolangan webhook.

E'tirozim: hisobotdagi hamma raqamni (tushum, top mahsulotlar, margin) **bitta** aggregation'da talab qilish — men buni so'roq ostiga olardim. `$facet` bilan bo'ladi-yu, lekin o'qish va indekslash qiyinlashadi. Ikkita kichik so'rovga bo'lsa toza va tushunarli bo'lardi.

## 9. Qo'shimcha himoya (qisqacha)

Bularni ham qo'shdim: login'ga urinishlar cheklangan (brute force'ga qarshi), qidiruvda xavfli belgilar tozalanadi (ReDoS bo'lmasin), kesh muddat bilan o'chadi, har biznesda turkum nomi takrorlanmaydi, va server o'chayotganda buyurtma yarmida uzilmaydi (graceful shutdown).
