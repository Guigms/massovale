// src/app/page.tsx
import Image from 'next/image';

// Definindo uma interface para tipar os objetos de serviço
interface Service {
  name: string;
  description: string;
  price: string;
  duration: string;
}

export default function Home() {
  // O array de serviços agora utiliza a interface 'Service'
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
    <div className="bg-white text-gray-800">
      <header className="fixed top-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-sm shadow-md z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-700">Jessica Vale Massoterapia</h1>
          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-teal-400 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-500 transition-colors duration-300 shadow-lg"
          >
            Agendar um Horário
          </a>
        </div>
      </header>

      <main>
        <section
          id="home"
          className="pt-32 pb-20 bg-cover bg-center"
        >
          <div className="bg-white bg-opacity-70">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Cuidado, Bem-Estar e Equilíbrio
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Permita-se uma pausa para renovar suas energias e encontrar a harmonia entre corpo e mente.
              </p>
              <a
                href="#servicos"
                className="bg-white text-teal-500 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-300 border border-teal-400 shadow-md"
              >
                Conheça os Serviços
              </a>
            </div>
          </div>
        </section>

        {/* Sobre Mim Section */}
        <section id="sobre" className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <Image
                src="/profile2.jpeg"
                alt="Foto da massoterapeuta Jessica Vale"
                width={350}
                height={350}
                className="rounded-full object-cover shadow-2xl"
              />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-teal-600 mb-4">Sobre a Profissional</h3>
              <h4 className="text-2xl font-semibold text-gray-700 mb-4">Jessica Vale</h4>
              <p className="text-lg text-gray-600 leading-relaxed">
          
              </p>
            </div>
          </div>
        </section>

        <section id="servicos" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-teal-600">Serviços e Valores</h3>
              <p className="text-lg text-gray-500 mt-2">Encontre o tratamento ideal para suas necessidades.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service) => (
                <div key={service.name} className="bg-teal-50 rounded-lg p-6 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-transform duration-300 flex flex-col">
                  <h4 className="text-xl font-bold text-teal-700 mb-2">{service.name}</h4>
                  <p className="text-gray-600 flex-grow mb-4">{service.description}</p>
                  <div className="mt-auto">
                    <p className="text-sm text-gray-500">{service.duration}</p>
                    <p className="text-2xl font-semibold text-teal-600">{service.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-6 text-center">
          <h4 className="text-2xl font-bold mb-4">Jessica Vale Massoterapia</h4>
          <p className="mb-6">Entre em contato e agende seu momento de cuidado.</p>
          <div className="flex justify-center space-x-6">
          </div>
          <p className="mt-8 text-sm text-gray-400">
            © {new Date().getFullYear()} Feito por{" "}
            <a
              href="https://gmsolutionti.com.br"
              className= "text-green-300 hover:underline"
            >
              GMSolution
            </a>. Todos os direitos Reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}