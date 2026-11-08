# Impulso · Motor virtual v2.0

Aplicação original, num único `index.html`, sem bibliotecas, fontes, gravações ou pedidos de rede (exceto o serviço de localização do próprio browser, se autorizado).

Esta pasta é a entrega expandida autónoma (v2.0): quinze assinaturas sintéticas, agrupadas em inspirações de modelos e arquiteturas de motor. Disponível via GitHub Pages: https://necolinhoo.github.io/ev-engine-sound/

Repositório público: https://github.com/nEcOLiNhOO/ev-engine-sound

A publicação HTTPS permite testar num browser normal, mas não garante que resolva a ausência de áudio numa pré-visualização móvel. Toca em **Iniciar som** na página aberta diretamente no browser.

## Experimentar
1. Abre `index.html` num browser moderno. A simulação não precisa de internet nem de servidor.
2. Toca em **Iniciar som**. O volume inicial é 15%; começa baixo também no dispositivo.
3. Aumenta a velocidade alvo: o motor acompanha a aceleração e faz mudanças virtuais. O controlo de resposta altera a rapidez da aceleração. Reduzir o alvo simula desaceleração.
4. Mantém **REV** premido para acelerar em vazio (não muda a velocidade). Soltar, cancelar o toque ou perder foco liberta o botão. Também aceita Espaço/Enter com foco.
5. Experimenta as quinze assinaturas (inspirações de modelos e arquiteturas), volume e caráter. Trocar de perfil enquanto o som corre faz um cruzamento suave entre vozes. **Parar som** fecha o contexto de áudio.

## Assinaturas
O seletor está dividido em dois grupos.

**Inspirações de modelos · síntese não oficial**
- 911 GT3 RS
- Nissan GT-R
- Lexus LFA
- Audi R8 V10
- Subaru WRX
- Mustang GT V8

**Arquiteturas de motor**
- I3, I4, I5, I6, V6, Flat-6, V8, V10 e V12

As inspirações são sínteses originais não oficiais. **Não são gravações nem reproduções autênticas** dos automóveis referidos, nem modelos físicos fiéis. Os limites de rotação, harmónicos, filtros de escape e admissão, ruído, irregularidade e forma de pulso são escolhas de design sintético para distinguir cada perfil — não fichas técnicas, redlines oficiais ou especificações de fábrica. Cada inspiração está rotulada no seletor como «síntese não oficial».

Dois perfis com o mesmo número de cilindros (por exemplo Flat-6 e a inspiração 911 GT3 RS, ou V8 e Mustang GT V8) usam afinações diferentes de timbre, não apenas o nome ou a contagem de cilindros.

## Modo GPS
Seleciona **GPS real** e toca em **Autorizar localização**. Requer contexto seguro: HTTPS ou localhost e permissão do browser. Abrir um ficheiro local é recomendado para simulação; não se deve contar com GPS via `file://`.

Para servir localmente, opcionalmente executa `python3 -m http.server 8000` nesta pasta e abre `http://localhost:8000`. Aceder pelo IP local de outro dispositivo em HTTP não equivale a localhost e normalmente não permite GPS. A versão alojada em GitHub Pages usa HTTPS e publica a raiz da branch `main`. O código continua a funcionar offline em modo de simulação.

O GPS fornece velocidade em m/s, convertida em km/h. Sem velocidade nativa, duas posições válidas permitem uma estimativa por distância/tempo. Filtra coordenadas inválidas, precisão pior que 80 m, grandes saltos e acelerações implausíveis. Oscilações pequenas são tratadas como ruído. Estes filtros são heurísticos: a velocidade pode atrasar, falhar ou ficar a zero em movimentos lentos. Sem velocidade válida, mostra **—** e mantém apenas o ralenti sintético, não inventa movimento. Uma posição com mais de 10 segundos é rejeitada; 8 segundos sem atualização válida tornam a leitura indisponível. As marchas, RPM e carga são sempre virtuais, mesmo com GPS.

**Não existe acesso ao pedal, CAN, Bluetooth do veículo, telemetria ou aceleração real do motor.** A carga é aproximada pela variação da velocidade. REV está desativado em modo GPS. Desligar a localização, mudar de modo, ocultar ou abandonar a página liberta o acompanhamento; regressar requer nova autorização pelo botão. Nenhuma localização é guardada ou enviada pela aplicação.

## Som e compatibilidade
Web Audio gera pulsos harmónicos de combustão de quatro tempos, um subgrave, ruído filtrado de admissão/escape e modulação irregular. Cada perfil altera a forma de onda (decai harmónico, ênfase par/ímpar e presença aguda), a filtragem de escape e de admissão, o ruído, a irregularidade e os ganhos de pulso/subgrave. A troca de perfil usa duas vozes com cruzamento e reduz o ganho da voz de entrada antes de mudar a wavetable, para evitar cliques. RPM/carga são suavizadas. Isto é síntese estilizada, não uma gravação nem um modelo físico fiel de cada motor. As mudanças são simuladas por escalões de relação, não por uma caixa real.

Ganho inicial baixo, alterações suaves e compressor/limitador reduzem picos, mas não garantem um nível acústico seguro: depende do volume do sistema e dos altifalantes. O som vem do browser/dispositivo; saída pelo sistema de som do carro **não garantida**. O browser pode suspender o áudio: toca em **Retomar som**. Ao ocultar a página, o som para; não há reprodução de fundo prometida.

Interface responsiva e tátil pensada para ecrãs largos e telemóveis. **Não houve teste físico num Tesla, nem teste de áudio/GPS num browser real nesta entrega.** Disponibilidade de Web Audio, geolocalização, saída áudio e funcionamento em movimento no Tesla precisam de validação. Não existe qualquer contorno de restrições do veículo. Configura estacionado; em viagem, só um passageiro deve testar a interface.

## Verificações realizadas
Executar `node test.cjs` (Node.js, sem dependências):
- análise sintática de todo o JavaScript inline com `vm.Script`;
- testes determinísticos de GPS: conversão m/s, velocidade ausente/negativa, fallback por posições, ruído, saltos, precisão, coordenadas inválidas, ordem temporal, aceleração implausível e intervalo antigo;
- mudanças virtuais, limites de RPM/carga para os quinze perfis, resposta de carga e mapeamento seguro de uma chave desconhecida;
- versão visível 2.0; presença e agrupamento das quinze assinaturas; rótulos de síntese não oficial;
- unicidade da afinação (harmónicos, escape, admissão, ruído, irregularidade e forma de pulso) e diferenças entre inspirações e arquiteturas com o mesmo número de cilindros;
- limites conservadores de ganho e ruído.

Os testes não reproduzem o DOM, interações táteis, permissões, som, volume percebido ou compatibilidade Tesla. Sugestão de ensaio manual, parado: iniciar/parar/reiniciar, trocar de perfil em reprodução, manter/libertar/cancelar REV, ocultar/regressar, recusar GPS, cortar sinal e confirmar **—**, verificar saída áudio antes de qualquer teste por passageiro.
