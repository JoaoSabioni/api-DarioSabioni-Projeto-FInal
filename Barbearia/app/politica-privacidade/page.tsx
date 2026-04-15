import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Elegance Studio',
  description: 'Política de Privacidade do Elegance Studio — Barbearia em Pinhal Novo.',
}

export default function PoliticaPrivacidade() {
  const today = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="bg-black text-white font-sans min-h-screen px-6 md:px-8 py-20 md:py-32">
      <div className="max-w-3xl mx-auto">

        <Link href="/main" className="text-[10px] tracking-[0.4em] text-zinc-600 uppercase hover:text-zinc-400 transition-colors mb-16 inline-block">← Elegance Studio</Link>

        <h1 className="font-serif text-[clamp(2rem,6vw,64px)] uppercase tracking-tighter leading-tight mb-4">
          Política de<br />Privacidade
        </h1>
        <p className="text-[11px] tracking-[0.3em] text-zinc-600 uppercase mb-16">Última atualização: {today}</p>

        <div className="space-y-12 text-[13px] text-zinc-400 leading-relaxed">

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">1. Responsável pelo Tratamento</h2>
            <p>
              <strong className="text-zinc-200">Elegance Studio</strong><br />
              Pinhal Novo, Portugal<br />
              Contacto: disponível através do formulário de marcação no site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">2. Dados Recolhidos e Finalidade</h2>
            <p>
              O Elegance Studio <strong className="text-zinc-200">não recolhe, armazena nem processa</strong> dados pessoais nos seus servidores.
            </p>
            <p className="mt-4">
              O formulário de marcação presente no site serve exclusivamente para <strong className="text-zinc-200">compor uma mensagem</strong> que o utilizador envia diretamente ao barbeiro escolhido, através das plataformas externas WhatsApp (Meta Platforms, Inc.) ou Instagram (Meta Platforms, Inc.). Os dados introduzidos (nome, serviço, data e horário pretendidos, mensagem adicional) são processados localmente no browser do utilizador e transmitidos diretamente para essas plataformas no momento do envio.
            </p>
            <p className="mt-4">
              O Elegance Studio não tem acesso, não guarda registo, e não partilha com terceiros quaisquer dados pessoais introduzidos neste site.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">3. Plataformas Externas</h2>
            <p>
              Ao clicar em "Enviar via WhatsApp" ou "Abrir Instagram", o utilizador é redirecionado para plataformas de terceiros. O tratamento de dados nessas plataformas é regido pelas respetivas políticas de privacidade:
            </p>
            <ul className="mt-4 space-y-2 list-disc list-inside">
              <li><a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-200 transition-colors">Política de Privacidade do WhatsApp</a></li>
              <li><a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-200 transition-colors">Política de Privacidade do Instagram</a></li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">4. Cookies e Rastreamento</h2>
            <p>
              Este site <strong className="text-zinc-200">não utiliza cookies</strong> de rastreamento, analytics ou publicidade. Não são instalados cookies de terceiros. O site pode utilizar cookies técnicos estritamente necessários para o funcionamento (ex: Next.js cache), que não recolhem dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">5. Direitos do Utilizador</h2>
            <p>
              Nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD — Regulamento UE 2016/679), o utilizador tem direito a aceder, retificar, apagar, limitar ou opor-se ao tratamento dos seus dados. Uma vez que o Elegance Studio não armazena dados pessoais, estes direitos devem ser exercidos diretamente junto das plataformas externas (WhatsApp/Instagram) onde a comunicação foi realizada.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">6. Segurança</h2>
            <p>
              O site é servido exclusivamente via HTTPS. Os dados introduzidos no formulário de marcação nunca são transmitidos para os servidores do Elegance Studio — saem diretamente do browser do utilizador para as plataformas externas escolhidas.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">7. Autoridade de Supervisão</h2>
            <p>
              O utilizador tem o direito de apresentar reclamação junto da autoridade de proteção de dados competente em Portugal:<br /><br />
              <strong className="text-zinc-200">CNPD — Comissão Nacional de Proteção de Dados</strong><br />
              <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-200 transition-colors">www.cnpd.pt</a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl uppercase tracking-tight text-white mb-4">8. Alterações a esta Política</h2>
            <p>
              Esta política pode ser atualizada para refletir alterações legais ou ao funcionamento do site. A data de última atualização é indicada no topo desta página.
            </p>
          </section>

        </div>

        <div className="mt-20 pt-10 border-t border-white/5">
          <Link href="/main" className="text-[11px] tracking-[0.4em] text-zinc-600 uppercase hover:text-zinc-400 transition-colors">← Voltar ao início</Link>
        </div>

      </div>
    </div>
  )
}
