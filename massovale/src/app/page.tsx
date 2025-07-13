// src/app/page.tsx
import Image from 'next/image';

interface Service {
  name: string;
  description: string;
  price: string;
  duration: string;
}

export default function Home() {

  const services: Service[] = [
    {
      name: 'Massagem Relaxante',
      description: 'Técnica que visa o relaxamento profundo do corpo e da mente, aliviando o estresse e a ansiedade.',
      price: 'R$ 120,00',
      duration: '60 min',
    },
    {
      name: 'Drenagem Linfática',
      description: 'Estimula o sistema linfático a trabalhar de forma mais acelerada, eliminando o excesso de líquido e toxinas.',
      price: 'R$ 150,00',
      duration: '60 min',
    },
    {
      name: 'Massagem Modeladora',
      description: 'Movimentos rápidos e intensos para remodelar o contorno corporal e combater a celulite.',
      price: 'R$ 140,00',
      duration: '50 min',
    },
    {
      name: 'Ventosaterapia',
      description: 'Técnica milenar que utiliza ventosas para criar vácuo, liberando tensões e melhorando a circulação sanguínea.',
      price: 'R$ 90,00',
      duration: '40 min',
    },
  ];

  return (
    <div className="bg-[#d1d1d1] text-stone-800">
      <header className="fixed top-0 left-0 right-0 bg-[#d1d1d1]/80 backdrop-blur-sm shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Image
            src="/logover2.png"
            alt="Logo Jessica Vale Massoterapia"
            width={120}
            height={40}
            priority
          />
          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white font-bold py-2 px-6 rounded-full hover:bg-stone-800 transition-colors duration-300 shadow-sm"
          >
            Agendar um Horário
          </a>
        </div>
      </header>
      <br/>
      <br/>


      {/* Padding no 'main' substitui os <br/> para um layout mais consistente */}
      <main className="pt-24">
        <section
          id="home"
          className="pb-20 bg-cover bg-center" // Considere usar uma imagem de fundo que combine com o tema claro
        >
          <div className="bg-white">
            <div className="container mx-auto px-6 text-center py-10">
              <h2 className="text-5xl font-bold text-black mb-4">
                Cuidado, Bem-Estar e Equilíbrio
              </h2>
              <p className="text-xl text-stone-700 mb-8">
                Permita-se uma pausa para renovar suas energias e encontrar a harmonia entre corpo e mente.
              </p>
              <a
                href="#servicos"
                className="bg-transparent text-black font-bold py-3 px-8 rounded-full hover:bg-black hover:text-white transition-colors duration-300 border-2 border-black"
              >
                Conheça os Serviços
              </a>
            </div>
          </div>
        </section>

        <section id="sobre" className="py-20 bg-white">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <Image
                src="/profile.jpeg"
                alt="Foto da massoterapeuta Jessica Vale"
                width={350}
                height={350}
                className="rounded-full object-cover shadow-xl shadow-stone-400/60"
              />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-black mb-4">Sobre a Profissional</h3>
              <h4 className="text-2xl font-semibold text-stone-900 mb-4">Jessica Vale</h4>
              <p className="text-lg text-stone-600 leading-relaxed">
                Com anos de experiência e uma paixão por promover o bem-estar, Jessica Vale se especializou em diversas técnicas terapêuticas para oferecer um atendimento personalizado e focado nas necessidades individuais de cada cliente. Sua missão é proporcionar alívio, relaxamento e uma melhor qualidade de vida através do toque.
              </p>
            </div>
          </div>
        </section>

        <section id="servicos" className="py-20 bg-[#d1d1d1]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-black">Serviços e Valores</h3>
              <p className="text-lg text-stone-700 mt-2">Encontre o tratamento ideal para suas necessidades.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service) => (
                <div key={service.name} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                  <h4 className="text-xl font-bold text-black mb-2">{service.name}</h4>
                  <p className="text-stone-600 flex-grow mb-4">{service.description}</p>
                  <div className="mt-auto border-t border-stone-200 pt-4">
                    <p className="text-sm text-stone-500">{service.duration}</p>
                    <p className="text-2xl font-semibold text-stone-900">{service.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white text-stone-700 py-10">
        <div className="container mx-auto px-6 text-center">
          <h4 className="text-2xl font-bold mb-4">Jessica Vale Massoterapia</h4>
          <p className="mb-6 text-stone-400">Entre em contato e agende seu momento de cuidado.</p>
          <div className="flex justify-center space-x-6">
          </div>
          <p className="mt-8 text-sm text-stone-500">
            © {new Date().getFullYear()} Feito por{" "}
            <a
              href="https://gmsolutionti.com.br"
              className="text-stone-400 hover:text-black transition-colors"
            >
              GMSolution
            </a>. Todos os direitos Reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}