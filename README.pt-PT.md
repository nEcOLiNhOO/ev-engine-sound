# Impulso · Motor virtual v3.1

Aplicação original, num único `index.html`, sem bibliotecas, fontes, gravações ou pedidos de rede (exceto o serviço de localização do próprio browser, se autorizado).

Esta pasta é a entrega autónoma v3.1 (correção do GPS sobre a v3.0): vinte e uma assinaturas sintéticas e estalos opcionais. Não é, por si só, uma publicação: a integração e o eventual GitHub Pages ficam a cargo de quem autorizar o envio.

O projeto público existente é https://github.com/nEcOLiNhOO/ev-engine-sound e o endereço HTTPS habitual é https://necolinhoo.github.io/ev-engine-sound/ — esta pasta v3.1 ainda pode não corresponder ao que está online.

A publicação HTTPS permite testar num browser normal, mas não garante que resolva a ausência de áudio numa pré-visualização móvel. Toca em **Iniciar som** na página aberta diretamente no browser.

## Experimentar
1. Abre `index.html` num browser moderno. A simulação não precisa de internet nem de servidor.
2. Toca em **Iniciar som**. O volume inicial é 15%; começa baixo também no dispositivo.
3. Aumenta a velocidade alvo: o motor acompanha a aceleração e faz mudanças virtuais. O controlo de resposta altera a rapidez da aceleração. Reduzir o alvo simula desaceleração.
4. Mantém **REV** premido para acelerar em vazio (não muda a velocidade). Soltar de propósito, com rotação alta, pode produzir um estalo se os pops estiverem ligados. Cancelar o toque, perder o foco ou ocultar a página não dispara estalos. Também aceita Espaço/Enter com foco.
5. Experimenta as vinte e uma assinaturas, volume e caráter. Cada perfil tem uma nota curta de carácter. Trocar de perfil enquanto o som corre faz um cruzamento suave entre vozes e cancela estalos pendentes. **Parar som** fecha o contexto de áudio.
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

**Arquiteturas**
- I3, I4, I5, I6, V6, Flat-6, V8, V10 e V12

As inspirações não são gravações nem cópias autênticas. Limites de rotação, harmónicos, filtros e irregularidade são escolhas de design para distinguir os timbres — não fichas técnicas. O Mazda RX-7 usa uma cadência de ignição de motor rotativo de dois rotores (um pulso por revolução do veio excêntrico, por rotor), sem o rotular como I4 ou como um motor de quatro cilindros.

## Estalos e pops
Efeito opcional, desligado por defeito, com intensidade ajustável. São ruídos curtos filtrados e um bate-estaca grave suave, sempre a passar pelo volume principal e pelo limitador.

Disparam apenas quando o som já está a correr e numa destas situações:
- desaceleração simulada com rotação suficientemente alta;
- largar o REV de propósito, com rotação adequada;
- desaceleração GPS válida, ou uma subida de marcha virtual enquanto a velocidade GPS também é válida.

Não disparam com perda de sinal, posição antiga, mudança de modo, reinício do áudio, página oculta ou troca de perfil. Há intervalo mínimo entre eventos, no máximo três vozes em simultâneo, e a probabilidade varia com o perfil: alguns desportivos (por exemplo C63, 458, RS3) estalam com mais facilidade do que um I6 ou um V12 suaves. O volume a zero ou o botão desligado impedem novos estalos e cancelam os que estavam a ser preparados.

Isto não reproduz mapas reais de afterfire nem o pedal do acelerador. Em GPS a desaceleração é inferida da velocidade.

## Modo GPS
Seleciona **GPS real** e toca em **Autorizar localização**. Requer contexto seguro: HTTPS ou localhost e permissão do browser. Abrir um ficheiro local é recomendado para simulação; não se deve contar com GPS via `file://`.

Para servir localmente, opcionalmente executa `python3 -m http.server 8000` nesta pasta e abre `http://localhost:8000`. Aceder pelo IP local de outro dispositivo em HTTP não equivale a localhost e normalmente não permite GPS. O código continua a funcionar offline em modo de simulação.

O GPS fornece velocidade em m/s, convertida em km/h. Sem velocidade nativa, duas posições válidas permitem uma estimativa por distância/tempo. Filtra coordenadas inválidas, precisão pior que 80 m, grandes saltos e acelerações implausíveis. Oscilações pequenas são tratadas como ruído. Estes filtros são heurísticos: a velocidade pode atrasar, falhar ou ficar a zero em movimentos lentos. Sem velocidade válida, mostra **—** e mantém apenas o ralenti sintético, não inventa movimento. A idade de cada posição é medida pela **hora de receção** no dispositivo, nunca pelo `timestamp` do browser: alguns browsers (incluindo o observado no Tesla) entregam timestamps com desvios de minutos ou horas, o que na v3.0 rejeitava todas as posições («Posição antiga rejeitada») e deixava a velocidade em **—**. Um timestamp repetido é ignorado como duplicado. 8 segundos sem atualização válida tornam a leitura indisponível; rejeições pontuais (por exemplo, precisão fraca) já não apagam de imediato a última velocidade válida. As marchas, RPM e carga são sempre virtuais, mesmo com GPS.

**Não existe acesso ao pedal, CAN, Bluetooth do veículo, telemetria ou aceleração real do motor.** A carga é aproximada pela variação da velocidade. REV está desativado em modo GPS. Desligar a localização, mudar de modo, ocultar ou abandonar a página liberta o acompanhamento; regressar requer nova autorização pelo botão. Nenhuma localização é guardada ou enviada pela aplicação.

### Diagnóstico GPS (v3.1)
No modo GPS, abre **Diagnóstico GPS** para ver: contexto seguro, permissão, **desvio do timestamp em segundos** (timestamp do browser − relógio do dispositivo; só informativo), precisão, velocidade nativa (ou «nula»), origem da velocidade, idade da última posição pela hora de receção, contagem de posições aceites/rejeitadas/repetidas, último motivo e último erro.

Outras correções: `maximumAge:0` (sem posições em cache), tempo de espera de 15 s, e a estimativa por posições usa uma referência estável, por isso funciona mesmo quando o browser envia posições mais de uma vez por segundo sem velocidade nativa.

## Som e compatibilidade
Web Audio gera pulsos harmónicos, um subgrave, ruído filtrado de admissão/escape e modulação irregular. Cada perfil altera a forma de onda, a filtragem, o ruído e a irregularidade. A troca de perfil usa duas vozes com cruzamento. RPM/carga são suavizadas. Isto é síntese estilizada, não uma gravação nem um modelo físico fiel. As mudanças são simuladas por escalões de relação, não por uma caixa real.

Ganho inicial baixo, envelopes curtos nos estalos, alterações suaves e compressor/limitador reduzem picos, mas não garantem um nível acústico seguro. O som vem do browser/dispositivo; saída pelo sistema de som do carro **não garantida**. O browser pode suspender o áudio: toca em **Retomar som**. Ao ocultar a página, o som para.

Interface pensada para ecrãs largos e telemóveis. **Não houve teste físico num Tesla, nem teste de escuta nesta entrega.** Disponibilidade de Web Audio, geolocalização, estalos, saída áudio e funcionamento em movimento no Tesla precisam de validação. Não existe qualquer contorno de restrições do veículo. Configura estacionado; em viagem, só um passageiro deve testar a interface.

## Verificações realizadas
Executar `node test.cjs` (Node.js, sem dependências):
- análise sintática de todo o JavaScript inline com `vm.Script`;
- testes determinísticos de GPS (conversão, ausência, ruído, saltos, precisão, ordem temporal, aceleração implausível);
- v3.1: timestamps desviados −60 s, −1 h e +1 h continuam a dar velocidade válida (nativa e estimada); posições a mais de 1 Hz sem velocidade nativa; timestamps repetidos; formatação do desvio no diagnóstico; ausência da rejeição por idade do timestamp.
- limites de RPM/carga para todos os perfis, mudanças virtuais e mapeamento seguro de uma chave desconhecida;
- versão visível 3.1; pelo menos 21 assinaturas; agrupamento; notas curtas de carácter; honestidade sem repetir o aviso em cada opção;
- unicidade da afinação, incluindo as novas inspirações face às arquiteturas aparentadas;
- o RX-7 é tratado como rotativo (2 rotores), não como um I4 de pistões;
- estalos: desligados/mute/parado não disparam; perda de sinal, modo, reinício, página oculta e troca de perfil são eventos proibidos; desaceleração, largar o REV e mudança virtual têm condições e intervalo; propensão diferente entre perfis; amplitude e duração limitadas.

**Estes testes cobrem apenas lógica e sintaxe. Não escutam áudio, não medem o volume percebido e não validam um browser Tesla.** Uma verificação numérica dos envelopes (pico e duração) corre no Core; não houve renderização ouvida nem interação com o browser. Sugestão de ensaio manual, parado: iniciar/parar, ligar pops a volume baixo, desacelerar na simulação, largar o REV, trocar de perfil e confirmar que não há estalos ao ocultar a página.
