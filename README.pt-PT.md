# Impulso · Motor virtual v3.7

Aplicação original, num único `index.html`, sem bibliotecas, fontes, gravações ou pedidos de rede (exceto o serviço de localização do próprio browser, se autorizado).

Esta pasta é a entrega autónoma v3.7 (caixa Conforto baseada na velocidade ganha/perdida nos últimos segundos; Desportiva igual à v3.6; timbre intermédio e áudio sem chiado da v3.6; SupraMotor 2JZ, kick-down, blips e pops por perfil): vinte e duas assinaturas sintéticas e estalos opcionais. Não é, por si só, uma publicação: a integração e o eventual GitHub Pages ficam a cargo de quem autorizar o envio.

O projeto público existente é https://github.com/nEcOLiNhOO/ev-engine-sound e o endereço HTTPS habitual é https://necolinhoo.github.io/ev-engine-sound/ — esta pasta v3.7 ainda pode não corresponder ao que está online.

A publicação HTTPS permite testar num browser normal, mas não garante que resolva a ausência de áudio numa pré-visualização móvel. Toca em **Iniciar som** na página aberta diretamente no browser.

## Experimentar
1. Abre `index.html` num browser moderno. A simulação não precisa de internet nem de servidor.
2. Toca em **Iniciar som**. O volume inicial é 15%; começa baixo também no dispositivo.
3. Aumenta a velocidade alvo: o motor acompanha a aceleração e faz mudanças virtuais. O controlo de resposta altera a rapidez da aceleração. Reduzir o alvo simula desaceleração.
4. Mantém **REV** premido para acelerar em vazio (não muda a velocidade). Soltar de propósito, com rotação alta, pode produzir um estalo se os pops estiverem ligados. Cancelar o toque, perder o foco ou ocultar a página não dispara estalos. Também aceita Espaço/Enter com foco.
5. Experimenta as vinte e duas assinaturas, volume e caráter. Cada perfil tem uma nota curta de carácter. Trocar de perfil enquanto o som corre faz um cruzamento suave entre vozes e cancela estalos pendentes. **Parar som** fecha o contexto de áudio.
6. **Estalos e pops** está desligado por omissão. Se o ligares, um cursor controla a intensidade. Não há reprodução automática: o motor só começa depois de tocares em **Iniciar som**.

## Assinaturas
O seletor está dividido em **Inspirações de modelos** e **Arquiteturas de motor**.

**Inspirações (síntese original, não oficial)**
- 911 GT3 RS, Nissan GT-R, Lexus LFA, Audi R8 V10, Subaru WRX, Mustang GT V8
- BMW M3 · seis em linha
- Mercedes-AMG C63 · V8
- Audi RS3 · cinco cilindros
- Lamborghini Aventador · V12
- Ferrari 458 · V8
- Mazda RX-7 · rotativo (dois rotores; não é um motor de pistões)
- SupraMotor 2JZ (v3.4) · seis em linha 3.0 turbo inspirado no 2JZ-GTE: ignição suave de I6, ralenti 850 rpm, máximo 7 100 rpm, sopro de admissão/turbo e flutter ao levantar (reutiliza o ruído de admissão e o flutter existentes; não há um som de blow-off dedicado), um pouco rouco nas altas; caixa desportiva com kick-down fácil, passagens altas e pops na passagem e ao levantar ao estilo turbo, com crackle acima do GT-R/WRX.

**Arquiteturas**
- I3, I4, I5, I6, V6, Flat-6, V8, V10 e V12

As inspirações não são gravações nem cópias autênticas. Limites de rotação, harmónicos, filtros e irregularidade são escolhas de design para distinguir os timbres — não fichas técnicas. O Mazda RX-7 usa uma cadência de ignição de motor rotativo de dois rotores (um pulso por revolução do veio excêntrico, por rotor), sem o rotular como I4 ou como um motor de quatro cilindros.

## Estalos e pops
Efeito opcional, desligado por defeito, com intensidade ajustável. São ruídos curtos filtrados e um bate-estaca grave suave, sempre a passar pelo volume principal e pela cadeia final (filtros, compressor suave e saturação suave).

Disparam apenas quando o som já está a correr e numa destas situações:
- desaceleração simulada com rotação suficientemente alta;
- largar o REV de propósito, com rotação adequada;
- desaceleração GPS válida, levantar o pé depois de acelerar (overrun), uma redução com blip, ou uma subida de marcha exigente, sempre com velocidade válida.

Não disparam com perda de sinal, posição antiga, mudança de modo, reinício do áudio, página oculta ou troca de perfil. Há intervalo mínimo entre eventos, no máximo três vozes em simultâneo, e a probabilidade varia com o perfil: alguns desportivos (por exemplo C63, 458, RS3) estalam com mais facilidade do que um I6 ou um V12 suaves. O volume a zero ou o botão desligado impedem novos estalos e cancelam os que estavam a ser preparados.

Isto não reproduz mapas reais de afterfire nem o pedal do acelerador. Em GPS a desaceleração é inferida da velocidade.

## Caixa automática virtual (v3.3)
A v3.2 já ficava em 7.ª a 120 km/h, mas **ao acelerar não reduzia**: no GPS a procura estimada a partir da velocidade chegava só a ~0,24 (0,6 m/s²) e ~0,48 (1,2 m/s²), abaixo do limiar fixo de kick-down (0,55). Na simulação, passar de 120 para 140 km/h com a resposta a 45 % também ficava abaixo do limiar. Além disso, o limite de rotação dos pops de desaceleração (máx. 2 200 rpm ou 38 % do máximo) ficava acima da rotação de cruzeiro, por isso quase nunca havia estalos.

A v3.3 mantém uma caixa virtual de 7 velocidades com estado e acrescenta:
- **Aceleração pelo histórico de velocidade:** em GPS, cada posição (≈1 Hz) é uma amostra discreta (hora de receção). A aceleração vem da inclinação curta (0,9 s) e da tendência (1,8 s). O ruído do GPS é estimado pelas segundas diferenças e não aumenta durante uma aceleração real.
- **Kick-down por níveis:** ≥ ~0,45 m/s² → 1 marcha, ≥ ~0,9 → 2, ≥ ~1,55 → 3 (vezes o fator do perfil; a Desportiva baixa os limiares). Com GPS ruidoso, o limiar sobe automaticamente (4× o ruído estimado) e uma subida isolada tem de ser confirmada pela tendência, para não haver trocas em cruzeiro.
- **Manter e voltar:** enquanto acelera, mantém a marcha baixa e sobe perto do ponto de passagem do perfil. Depois de 2–4 s de velocidade estável (conforme o perfil; mais longo na Desportiva), regressa progressivamente à marcha de cruzeiro.
- **Desaceleração:** reduções progressivas com **toque de acelerador** (blip de 0,22 s, rotação igualada) e nunca sobe enquanto trava; parado fica em N.
- **Personalidade por perfil (22):** limiar de kick-down, pontos de passagem, rotação mínima, tempo de regresso, tamanho do blip, quando reduz a travar, propensão a pops na passagem e limite de rotação para pops. Um GT3 RS ou 458 reduz cedo e sobe alto; um I6 ou V12 suave é mais calmo. **Conforto / Desportiva** aplica-se por cima (Desportiva: sem 7.ª, rotação mínima mais alta, kick-down mais fácil, blips maiores, regresso mais lento).
- **Carga:** depende da procura; em cruzeiro ~0,2.

**Pops (com Estalos ligados):** levantar o pé depois de acelerar e as reduções com blip geram eventos de *overrun*; passagens de caixa exigentes nos perfis desportivos/turbo podem estalar. O limite de rotação passa a ser relativo ao perfil, e a probabilidade cresce de forma não linear com a propensão: desportivos estalam várias vezes num levantar de pé, os suaves quase nunca. Continuam desligados por defeito, com no máximo 3 vozes, intervalo mínimo e pico limitado, e nunca disparam com perda de sinal, mudança de modo, reinício de áudio, página oculta ou troca de perfil.

Valores medidos nos testes (GPS simulado a 1 Hz, ruído ~0,3 km/h, Conforto; a marcha/rpm é o ponto mais baixo/alto durante 4 s de aceleração desde 120 km/h; "pops" é a média de estalos num acelerar-e-levantar com intensidade 50):

| Perfil | Cruzeiro 120 (marcha/rpm) | +0,6 m/s² (marcha/rpm, mediana 1.ª redução) | +1,2 m/s² (marcha/rpm) | pops lift-off (média 5 seeds) | crackle / popUp |
| gt3rs | 7.ª / 2700 | 5.ª / 5459 (1.0 s) | 4.ª / 7503 | 4.4 (alta) | 0.62 / 0.35 |
| gtr | 7.ª / 2191 | 6.ª / 3227 (1.0 s) | 5.ª / 4726 | 1.8 (baixa) | 0.35 / 0.75 |
| lfa | 7.ª / 2700 | 6.ª / 3977 (1.0 s) | 4.ª / 7990 | 3.2 (média) | 0.5 / 0.3 |
| r8v10 | 7.ª / 2622 | 6.ª / 3864 (1.0 s) | 4.ª / 7288 | 4.4 (alta) | 0.6 / 0.4 |
| wrx | 7.ª / 2067 | 6.ª / 3045 (1.0 s) | 5.ª / 4460 | 2.8 (média) | 0.42 / 0.8 |
| mustang | 7.ª / 1975 | 6.ª / 2909 (1.0 s) | 5.ª / 4260 | 4.4 (alta) | 0.62 / 0.3 |
| m3 | 7.ª / 2561 | 6.ª / 3773 (1.0 s) | 4.ª / 7117 | 4.0 (alta) | 0.58 / 0.35 |
| c63 | 7.ª / 2160 | 6.ª / 3182 (1.0 s) | 5.ª / 4660 | 8.8 (alta) | 0.92 / 0.6 |
| rs3 | 7.ª / 2221 | 6.ª / 3273 (1.0 s) | 5.ª / 4793 | 6.2 (alta) | 0.72 / 0.55 |
| aventador | 7.ª / 2684 | 6.ª / 3955 (1.0 s) | 4.ª / 7460 | 6.2 (alta) | 0.7 / 0.55 |
| f458 | 7.ª / 2700 | 6.ª / 3977 (1.0 s) | 4.ª / 7503 | 7.4 (alta) | 0.8 / 0.4 |
| rx7 | 7.ª / 2530 | 6.ª / 3727 (1.0 s) | 4.ª / 7031 | 4.0 (alta) | 0.58 / 0.45 |
| supra2jz | 7.ª / 2191 | 6.ª / 3227 (1.0 s) | 4.ª / 6088 | 3.6 (média) | 0.55 / 0.7 |
| i3 | 7.ª / 2067 | 6.ª / 3045 (1.0 s) | 5.ª / 4460 | 1.0 (baixa) | 0.22 / 0.05 |
| i4 | 7.ª / 2252 | 6.ª / 3318 (1.0 s) | 5.ª / 4860 | 0.4 (baixa) | 0.18 / 0.08 |
| i5 | 7.ª / 2191 | 6.ª / 3227 (1.0 s) | 5.ª / 4726 | 1.8 (baixa) | 0.35 / 0.15 |
| i6 | 7.ª / 2221 | 6.ª / 3273 (1.0 s) | 5.ª / 4793 | 0.2 (baixa) | 0.08 / 0.04 |
| v6 | 7.ª / 2283 | 6.ª / 3364 (1.0 s) | 5.ª / 4926 | 1.4 (baixa) | 0.28 / 0.12 |
| flat6 | 7.ª / 2468 | 6.ª / 3636 (1.0 s) | 5.ª / 5326 | 1.4 (baixa) | 0.32 / 0.2 |
| v8 | 7.ª / 2098 | 6.ª / 3091 (1.0 s) | 5.ª / 4527 | 3.2 (média) | 0.45 / 0.2 |
| v10 | 7.ª / 2684 | 6.ª / 3955 (1.0 s) | 5.ª / 5792 | 2.4 (média) | 0.38 / 0.2 |
| v12 | 7.ª / 2700 | 6.ª / 3977 (1.0 s) | 5.ª / 5825 | 0.2 (baixa) | 0.12 / 0.05 |

**Limites honestos:** com posições a 1 Hz a primeira redução surge normalmente 1–1,5 s depois de começar a acelerar (até ~2,5 s se a aceleração começar logo a seguir a uma posição ou se o GPS for ruidoso). Com GPS muito ruidoso, pequenas acelerações (≈0,6 m/s²) podem não ser detetadas: é a troca escolhida para não haver trocas falsas em cruzeiro. Relações, pontos de passagem e personalidades são escolhas de design sintético, não dados de caixas ou motores reais.

### Conforto na v3.7: decide pela velocidade ganha ou perdida
Na v3.7, a caixa **Conforto** deixa de reagir a um toque ou a uma única leitura do GPS. Decide pela velocidade ganha ou perdida nos últimos segundos. A **Desportiva não mudou**: é exatamente a caixa da v3.6, e há um teste que o confirma.
- **Histórico de ~12 s** da velocidade (posições GPS a 1 Hz, ou a velocidade simulada). Calcula a variação ao longo de **3 s** e de **9 s** por mínimos quadrados, o que é robusto ao ruído.
- **Aceleração lenta** (por exemplo 100→110 km/h em 8–10 s, ≈0,3 m/s²): **mantém a 7.ª**; só aumenta a carga no som.
- **Aceleração rápida** (+10 km/h em 2–3 s): reduz 1–2 marchas (3 só em acelerações muito fortes, ≈19 km/h em 3 s). **Segura a marcha** enquanto a velocidade continua a subir; quando estabiliza (variação em 3 s perto de zero), volta a subir como antes.
- **Intermédia** (+10 km/h em ~5 s): no máximo 1 marcha. Os perfis mais vivos reduzem; os calmos normalmente não.
- **Limiares por perfil:** 7 / 10,5 / 19 km/h ganhos em 3 s para 1 / 2 / 3 marchas, vezes o fator do perfil (GT3 RS 0,80 … I6/V12 1,05). Com GPS ruidoso, sobem automaticamente.
- **A abrandar:** só reduz quando a velocidade cai de facto (pelo menos 5 km/h perdidos em 3 s, ou 8 km/h numa desaceleração lenta em 9 s). Depois, a marcha acompanha a velocidade: reduz uma de cada vez quando a rotação da marcha atual desce abaixo do ponto do perfil, sempre com toque de acelerador (blip) e pops de overrun se os estalos estiverem ligados. Um levantar breve (−2 km/h em 1,5 s) não provoca redução.
- **Simulação:** usa a mesma lógica a partir da velocidade simulada.
- **Sem oscilações:** 60 s de cruzeiro com GPS ruidoso continuam sem trocas (também com ruído forte).

Comportamento medido (GPS simulado a 1 Hz com ruído ~0,5 km/h, 10 sementes; "−1 ×9" = reduz 1 marcha em 9 de 10):

Conforto steady 60 s, noise 0.5 km/h: shifts 0 in 66 runs
Conforto steady 60 s, noise 0.8 km/h: shifts 0 in 66 runs
Conforto steady 60 s, noise 1.2 km/h: shifts 0 in 66 runs
| perfil | lento 100→110 em 9 s | intermédio +10 em 5 s | rápido +10 em 2,5 s | regresso à 7.ª (após estabilizar) | 0,6 m/s² 4 s | 1,2 m/s² 4 s | levantar −2 km/h | travagem 120→60: velocidades das reduções |
|---|---|---|---|---|---|---|---|---|
| v8 | −0 ×10 | −0 ×10 | −1 ×9,2 ×1 (1.ª redução 2.0 s) | 5.7 s | −0 ×6,1 ×4 (1.ª redução 4.0 s) | −2 ×10 (1.ª redução 2.0 s) | −0 ×10 | 98 → 70 km/h (perdidos 22 km/h na 1.ª) |
| gt3rs | −0 ×10 | −1 ×10 (1.ª redução 3.0 s) | −2 ×10 (1.ª redução 2.0 s) | 5.7 s | −1 ×10 (1.ª redução 3.0 s) | −2 ×10 (1.ª redução 2.0 s) | −0 ×10 | 113 → 98 → 70 km/h (perdidos 7 km/h na 1.ª) |
| i4 | −0 ×10 | −0 ×10 | −1 ×9,2 ×1 (1.ª redução 2.0 s) | 6.1 s | −0 ×6,1 ×4 (1.ª redução 4.0 s) | −2 ×10 (1.ª redução 2.0 s) | −0 ×10 | 84 → 60 km/h (perdidos 36 km/h na 1.ª) |
| supra2jz | −0 ×10 | −1 ×9,0 ×1 (1.ª redução 3.0 s) | −2 ×10 (1.ª redução 2.0 s) | 6.1 s | −1 ×10 (1.ª redução 3.0 s) | −2 ×10 (1.ª redução 2.0 s) | −0 ×10 | 113 → 88 → 62 km/h (perdidos 7 km/h na 1.ª) |
| v12 | −0 ×10 | −0 ×10 | −1 ×10 (1.ª redução 2.0 s) | 6.5 s | −0 ×7,1 ×3 (1.ª redução 3.0 s) | −2 ×10 (1.ª redução 2.0 s) | −0 ×10 | 80 → 60 km/h (perdidos 40 km/h na 1.ª) |

## Modo GPS
Seleciona **GPS real** e toca em **Autorizar localização**. Requer contexto seguro: HTTPS ou localhost e permissão do browser. Abrir um ficheiro local é recomendado para simulação; não se deve contar com GPS via `file://`.

Para servir localmente, opcionalmente executa `python3 -m http.server 8000` nesta pasta e abre `http://localhost:8000`. Aceder pelo IP local de outro dispositivo em HTTP não equivale a localhost e normalmente não permite GPS. O código continua a funcionar offline em modo de simulação.

O GPS fornece velocidade em m/s, convertida em km/h. Sem velocidade nativa, duas posições válidas permitem uma estimativa por distância/tempo. Filtra coordenadas inválidas, precisão pior que 80 m, grandes saltos e acelerações implausíveis. Oscilações pequenas são tratadas como ruído. Estes filtros são heurísticos: a velocidade pode atrasar, falhar ou ficar a zero em movimentos lentos. Sem velocidade válida, mostra **—** e mantém apenas o ralenti sintético, não inventa movimento. A idade de cada posição é medida pela **hora de receção** no dispositivo, nunca pelo `timestamp` do browser: alguns browsers (incluindo o observado no Tesla) entregam timestamps com desvios de minutos ou horas, o que na v3.0 rejeitava todas as posições («Posição antiga rejeitada») e deixava a velocidade em **—**. Um timestamp repetido é ignorado como duplicado. 8 segundos sem atualização válida tornam a leitura indisponível; rejeições pontuais (por exemplo, precisão fraca) já não apagam de imediato a última velocidade válida. As marchas, RPM e carga são sempre virtuais, mesmo com GPS.

**Não existe acesso ao pedal, CAN, Bluetooth do veículo, telemetria ou aceleração real do motor.** A carga é aproximada pela variação da velocidade. REV está desativado em modo GPS. Desligar a localização, mudar de modo, ocultar ou abandonar a página liberta o acompanhamento; regressar requer nova autorização pelo botão. Nenhuma localização é guardada ou enviada pela aplicação.

### Diagnóstico GPS (v3.1)
No modo GPS, abre **Diagnóstico GPS** para ver: contexto seguro, permissão, **desvio do timestamp em segundos** (timestamp do browser − relógio do dispositivo; só informativo), precisão, velocidade nativa (ou «nula»), origem da velocidade, idade da última posição pela hora de receção, contagem de posições aceites/rejeitadas/repetidas, último motivo e último erro.

Outras correções: `maximumAge:0` (sem posições em cache), tempo de espera de 15 s, e a estimativa por posições usa uma referência estável, por isso funciona mesmo quando o browser envia posições mais de uma vez por segundo sem velocidade nativa.

## Áudio no Tesla (v3.5)
**Porque havia chiado a volume alto (v3.4):** medição offline da cadeia de áudio (reimplementação em Node dos filtros e osciladores Web Audio; não é uma escuta):
- o ruído de admissão (ruído branco num passa-banda largo) estava **sempre ligado**, mesmo ao ralenti e em cruzeiro, só 13–28 dB(A) abaixo do tom do motor;
- a saída era baixa: no volume por omissão (15 %) cerca de −37 dBFS RMS, e mesmo a 70 % só −20 a −26 dBFS, 10–25 dB abaixo de música normal. Para ouvir o motor, era preciso subir muito o volume do carro, o que também amplifica o ruído de fundo;
- 25–59 % da energia do tom ao ralenti/cruzeiro era um subgrave a 6–20 Hz, que as colunas quase não reproduzem: ocupava margem sem se ouvir;
- o limitador (−16 dB, 12:1) nunca chegava a comprimir; funcionava apenas como um ganho fixo de +6,6 dB.

**O que mudou:**
- ruído de admissão/turbo **só em carga real**: ao ralenti e em cruzeiro fica 55–74 dB(A) abaixo do tom; em aceleração forte 29–36 dB abaixo (com o novo controlo a 25 %). Filtrado entre 150 Hz e 2,5 kHz, sem chiado de banda larga;
- novo controlo **Ruído de admissão · só em carga** (0–100 %, 25 % por omissão, guardado neste dispositivo). A 0 % não há ruído; sobe-o se quiseres mais textura;
- cadeia final: passa-alto 35 Hz (sem ronco inaudível nem DC) → passa-baixo suave 7 kHz → compressor suave (3:1) → saturação suave com sobreamostragem 4×, em vez do limitador 12:1;
- harmónicos limitados por gama de rotação: nenhum parcial acima de min(taxa de amostragem/4, 12 kHz), para não haver aspereza perto de Nyquist; o vibrato (flutter) tem profundidade limitada;
- subgrave uma oitava abaixo da frequência de ignição (38–160 Hz), audível nas colunas;
- ganho: no mesmo volume da aplicação o motor soa cerca de 7 dB mais alto (ponderação A); a 70 % os picos ficam por volta de −1,5 dBFS, sem corte duro. Os estalos continuam com os mesmos limites (pico ≤ 0,22 antes do volume, máx. 3 vozes, intervalo mínimo).

**Ajuste intermédio (v3.6):** a v3.5 eliminou o chiado, mas o timbre ficou estranho (agudos cortados a 7 kHz, subgrave forte uma oitava abaixo, compressão e saturação mais presentes). A v3.6 fica a meio caminho em cada elemento que muda o timbre e mantém a correção do chiado:
- passa-baixo final 7 kHz → **11,5 kHz** (volta brilho e aspereza); passa-alto 35 → **25 Hz**;
- harmónicos: limite min(taxa/4, 12 kHz) → **min(0,72 × Nyquist, 16 kHz)**, por isso os motores de muitos cilindros recuperam harmónicos a rotação alta (sempre abaixo de Nyquist);
- subgrave: continua audível (uma oitava abaixo da ignição, mínimo 30 Hz), mas com **cerca de metade** do ganho da v3.5, para dar corpo sem ribombar;
- dinâmica: compressor **6:1 a −12 dB** (v3.4: 12:1 a −16, sem efeito real; v3.5: 3:1); a saturação suave só atua perto de 0 dBFS (joelho 0,85, teto 0,98), sem colorir níveis normais;
- vibrato (flutter): limite 3,5 % → **7 %** da frequência de ignição;
- ganho: cerca de **+3,7 dB** face à v3.4 (a v3.5 tinha +7 dB);
- ruído de admissão: igual à v3.5 (só em carga, 150 Hz–2,5 kHz, controlo a 25 %): ao ralenti e em cruzeiro continua 55–74 dB(A) abaixo do tom em todos os perfis.

Medições offline (modelo Node da cadeia Web Audio, volume da app a 70 %, caráter 40 %; não é uma escuta). Brilho = centroide espectral acima de 100 Hz; percentagens de agudos e grave calculadas sobre a banda audível (≥ 25 Hz); "carga" = 75 % do máximo com carga 0,9:

| perfil | versão | brilho (centroide >100 Hz) ralenti/cruzeiro/carga, Hz | >3 kHz % (carga) | >7 kHz % (carga) | grave 25–100 Hz % ralenti/cruzeiro | <25 Hz % ralenti/cruzeiro | ruído abaixo do tom dB(A) ralenti/cruzeiro/carga | 70 %: RMS/pico dBFS (carga) | dB(A) vs v3.4 (cruzeiro) |
|---|---|---|---|---|---|---|---|---|---|
| v8 | v3.4 | 311 / 446 / 886 | 0.5 | 0.08 | 45 / 1 | 36 / 34 | 24 / 24 / 18 | -20.3 / -10.1 | 0.0 |
| v8 | v3.5 | 310 / 442 / 678 | 0.3 | 0.00 | 50 / 23 | 0 / 0 | 68 / 71 / 33 | -14.0 / -3.7 | 7.3 |
| v8 | v3.6 | 311 / 443 / 797 | 0.3 | 0.00 | 48 / 9 | 0 / 0 | 68 / 71 / 33 | -18.1 / -8.0 | 3.8 |
| gt3rs | v3.4 | 392 / 644 / 1361 | 6.9 | 0.31 | 48 / 0 | 20 / 19 | 21 / 21 / 16 | -22.3 / -10.5 | 0.0 |
| gt3rs | v3.5 | 387 / 636 / 1127 | 5.4 | 0.01 | 49 / 11 | 0 / 0 | 62 / 67 / 31 | -15.6 / -3.9 | 7.3 |
| gt3rs | v3.6 | 388 / 637 / 1241 | 6.4 | 0.03 | 48 / 4 | 0 / 0 | 62 / 67 / 31 | -19.3 / -8.0 | 3.8 |
| i4 | v3.4 | 211 / 379 / 680 | 1.2 | 0.18 | 69 / 35 | 19 / 17 | 15 / 18 / 15 | -21.0 / -10.1 | 0.0 |
| i4 | v3.5 | 203 / 369 / 623 | 0.5 | 0.00 | 61 / 38 | 0 / 0 | 57 / 63 / 30 | -14.1 / -2.7 | 7.3 |
| i4 | v3.6 | 205 / 370 / 626 | 0.5 | 0.00 | 66 / 36 | 0 / 0 | 57 / 63 / 30 | -17.8 / -6.8 | 3.7 |
| supra2jz | v3.4 | 294 / 352 / 757 | 0.7 | 0.09 | 60 / 1 | 30 / 28 | 21 / 21 / 16 | -19.9 / -9.3 | 0.0 |
| supra2jz | v3.5 | 291 / 349 / 613 | 0.3 | 0.00 | 60 / 16 | 0 / 0 | 62 / 66 / 29 | -13.3 / -2.7 | 7.3 |
| supra2jz | v3.6 | 291 / 349 / 687 | 0.4 | 0.00 | 60 / 6 | 0 / 0 | 62 / 66 / 29 | -17.2 / -7.0 | 3.7 |
| v12 | v3.4 | 510 / 825 / 1633 | 9.7 | 0.22 | 38 / 0 | 21 / 21 | 28 / 27 / 20 | -22.6 / -12.6 | 0.0 |
| v12 | v3.5 | 505 / 721 / 1375 | 9.3 | 0.04 | 43 / 0 | 0 / 0 | 71 / 73 / 36 | -15.7 / -5.8 | 7.0 |
| v12 | v3.6 | 508 / 792 / 1537 | 11.1 | 0.10 | 40 / 0 | 0 / 0 | 72 / 74 / 35 | -20.0 / -10.6 | 3.7 |

Leitura: o brilho em carga e a energia acima de 7 kHz ficam entre a v3.4 e a v3.5 (no I4 o brilho fica quase igual ao da v3.5). A percentagem acima de 3 kHz do V12 em carga fica ligeiramente acima de ambas (11,1 %), porque o subgrave é mais leve e a medida é relativa. O grave audível ao ralenti continua perto da v3.5, porque nesses perfis a própria ignição fica abaixo de 100 Hz. O ruído abaixo do tom mantém-se igual ao da v3.5.

**Dicas no carro:**
1. Começa com o volume do Tesla moderado (por exemplo um terço) e sobe primeiro o **volume da aplicação** (50–70 %). Assim o sinal fica bem acima do ruído do sistema de som.
2. Se ainda ouvires sopro, baixa o **Ruído de admissão** (0–15 %). A 0 % o som é só tonal.
3. Evita o volume do Tesla no máximo com a aplicação baixa: isso amplifica o ruído de fundo do próprio sistema.
4. Música e motor ao mesmo tempo: baixa um pouco a música, em vez de subir tudo.

**Comparação com o teslasound.io (só pelo que é público):** o site diz que o som é sintetizado ao vivo, sem gravações nem loops ("firing order", pulsos de escape, tubos, admissão que "ruge em carga", crackle a 0 % = motor limpo). Os ficheiros públicos usam um AudioWorklet (síntese amostra a amostra), um WaveShaper com sobreamostragem e um compressor. Não li nem copiei o código; a afinação e os níveis deles não foram verificados. A v3.5 segue a mesma ideia geral: ruído só em carga e nível de saída alto e limpo.

## Som e compatibilidade
Web Audio gera pulsos harmónicos, um subgrave, ruído filtrado de admissão/escape e modulação irregular. Cada perfil altera a forma de onda, a filtragem, o ruído e a irregularidade. A troca de perfil usa duas vozes com cruzamento. RPM/carga são suavizadas. Isto é síntese estilizada, não uma gravação nem um modelo físico fiel. As mudanças são simuladas por escalões de relação, não por uma caixa real.

Ganho inicial baixo, envelopes curtos nos estalos, alterações suaves, compressor suave e saturação suave reduzem picos, mas não garantem um nível acústico seguro. O som vem do browser/dispositivo; saída pelo sistema de som do carro **não garantida**. O browser pode suspender o áudio: toca em **Retomar som**. Ao ocultar a página, o som para.

Interface pensada para ecrãs largos e telemóveis. **Não houve teste físico num Tesla, nem teste de escuta nesta entrega.** Disponibilidade de Web Audio, geolocalização, estalos, saída áudio e funcionamento em movimento no Tesla precisam de validação. Não existe qualquer contorno de restrições do veículo. Configura estacionado; em viagem, só um passageiro deve testar a interface.

## Verificações realizadas
Executar `node test.cjs` (Node.js, sem dependências):
- análise sintática de todo o JavaScript inline com `vm.Script`;
- testes determinísticos de GPS (conversão, ausência, ruído, saltos, precisão, ordem temporal, aceleração implausível);
- v3.7: Desportiva idêntica à v3.6 (mesmo código e mesmas saídas para as mesmas entradas); Conforto com GPS ruidoso a 1 Hz: 100→110 km/h em 9 s sem reduções; +10 km/h em 2,5 s reduz ≥1 marcha, segura enquanto acelera e volta à 7.ª depois de estabilizar; +10 km/h em 5 s no máximo 1 marcha (mais nos perfis vivos); levantar −2 km/h sem reduções; travagem 120→60 com reduções a acompanhar a velocidade, com blip e nenhuma antes de perder 5 km/h; simulação com a mesma lógica. Testes adaptados: 0,6 m/s² durante 4 s passa a ser "intermédio" no Conforto (no máximo 1 marcha, conforme o perfil) e mantém a expectativa original (≥1 marcha em ~1,5 s) na Desportiva; o mesmo no teste do SupraMotor 2JZ.
- v3.6: parâmetros de áudio entre a v3.4 e a v3.5 (passa-alto, passa-baixo, limite de harmónicos e número de harmónicos por perfil, rácio/limiar do compressor, joelho da saturação, ganho efetivo ≈ metade do passo, flutter e subgrave); intervalos adaptados: passa-alto 20–30 Hz, passa-baixo 10–13 kHz, compressor ≤ 8:1, limite de harmónicos 0,72 × Nyquist/16 kHz, subgrave ≥ 30 Hz.
- v3.5: ruído quase nulo ao ralenti e em cruzeiro para os 22 perfis (também com o controlo a 100 %); o ruído sobe com a carga e com o controlo, e é zero a 0 %; constantes da cadeia (passa-alto 30–40 Hz, passa-baixo 6–8 kHz, ruído 150 Hz–2,5 kHz, compressor ≤ 4:1, sem 12:1, saturação 4× limitada); limite de harmónicos abaixo de Nyquist a 44,1 e 48 kHz, à rotação máxima, em todos os perfis; subgrave audível e flutter limitado; controlo Ruído de admissão (25 % por omissão, guardado, valores inválidos ignorados); página com AudioContext simulado: master → passa-alto → passa-baixo → compressor → saturação, ruído baixo ao ralenti e mais alto em aceleração, ondas limitadas por gama.
- v3.4: SupraMotor 2JZ existe com esse nome no grupo das inspirações, ignição de I6, limites válidos, cruzeiro a 120 km/h em 7.ª entre 1 500 e 3 000 rpm, kick-down a 0,6/1,2 m/s², pops ao levantar com estalos ligados e nenhum com desligados, passagens exigentes como candidatas a pop; contagem de perfis passa de 21 para 22.
- v3.3: personalidade de caixa para os 21 perfis (Desportiva por cima); 0,6 m/s² durante 4 s desde 120 km/h com GPS ruidoso a 1 Hz reduz ≥1 marcha em todos os perfis (≤1,5 s em ≥15 de 20 sementes, sempre ≤2,5 s); 1,2 m/s² reduz ≥2 marchas; 60 s de cruzeiro ruidoso sem trocas em todos os perfis e estilos; regresso à 7.ª depois da aceleração; desaceleração com reduções, blips e rotação limitada; acelerar e levantar com pops ligados estala nos desportivos, pouco ou nada nos suaves e nunca com pops desligados; regras de segurança do overrun e limite de rotação por perfil; simulação com alvo/resposta provoca kick-down.
- v3.2: caixa virtual — 120 km/h constantes com ruído tipo GPS chega à 7.ª entre 1 800 e 3 000 rpm, sem oscilar e sem candidatos a pops; 60 s de cruzeiro ruidoso sem trocas; os 21 perfis em cruzeiro dentro de ralenti…máx×0,94; aceleração forte provoca kick-down e mais rotação/carga; desaceleração reduz sem subir e termina em 1.ª; parado = N; intervalo mínimo entre trocas; Desportiva com mais rotação do que Conforto; ligação da página ao seletor e aos pops.
- v3.1: timestamps desviados −60 s, −1 h e +1 h continuam a dar velocidade válida (nativa e estimada); posições a mais de 1 Hz sem velocidade nativa; timestamps repetidos; formatação do desvio no diagnóstico; ausência da rejeição por idade do timestamp.
- limites de RPM/carga para todos os perfis, mudanças virtuais e mapeamento seguro de uma chave desconhecida;
- versão visível 3.7; pelo menos 22 assinaturas; agrupamento; notas curtas de carácter; honestidade sem repetir o aviso em cada opção;
- unicidade da afinação, incluindo as novas inspirações face às arquiteturas aparentadas;
- o RX-7 é tratado como rotativo (2 rotores), não como um I4 de pistões;
- estalos: desligados/mute/parado não disparam; perda de sinal, modo, reinício, página oculta e troca de perfil são eventos proibidos; desaceleração, largar o REV e mudança virtual têm condições e intervalo; propensão diferente entre perfis; amplitude e duração limitadas.

**Estes testes cobrem apenas lógica e sintaxe. Não escutam áudio, não medem o volume percebido e não validam um browser Tesla.** Uma verificação numérica dos envelopes (pico e duração) corre no Core; não houve renderização ouvida nem interação com o browser. Sugestão de ensaio manual, parado: iniciar/parar, ligar pops a volume baixo, desacelerar na simulação, largar o REV, trocar de perfil e confirmar que não há estalos ao ocultar a página.
