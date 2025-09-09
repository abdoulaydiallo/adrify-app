"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  ArrowRight,
  Download,
  CheckCircle,
  Star,
  Globe,
  Users,
  Truck,
  Banknote,
  Building,
  Clock,
  QrCode,
  Shield,
  Smartphone,
} from "lucide-react";
import{ Header} from "@/components/layout/header";

export default function AdrifyLanding() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      text: "Avec Adrify, le livreur m'a trouvé du premier coup, fini les appels pour expliquer ma maison.",
      author: "Mariama, Conakry",
      rating: 5,
    },
    {
      text: "Plus besoin de dessiner des cartes pour mes clients. Adrify simplifie tout !",
      author: "Ibrahim, Entrepreneur",
      rating: 5,
    },
    {
      text: "Ma banque a validé mon adresse en quelques minutes grâce à Adrify.",
      author: "Fatoumata, Kankan",
      rating: 5,
    },
  ];

  useEffect(() => {
    const interval = setInterval(
      () => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Créer vos adresses",
      description: "Générez des adresses numériques précises et partageables.",
    },
    {
      icon: CheckCircle,
      title: "Validation instantanée",
      description:
        "Vos adresses sont vérifiées pour la livraison et les services.",
    },
    {
      icon: Globe,
      title: "Couverture nationale",
      description:
        "Fonctionne partout en Guinée, que vous soyez en ville ou à la campagne.",
    },
    {
      icon: Smartphone,
      title: "Application mobile",
      description: "Accédez à vos adresses directement depuis votre téléphone.",
    },
  ];

  const useCases = [
    {
      icon: Truck,
      title: "Livraison rapide",
      description: "Les livreurs trouvent votre adresse sans effort.",
    },
    {
      icon: Banknote,
      title: "Banques & services",
      description: "Validez vos comptes et services financiers rapidement.",
    },
    {
      icon: Building,
      title: "Entreprises locales",
      description:
        "Simplifiez la logistique et la distribution pour vos clients.",
    },
    {
      icon: QrCode,
      title: "Partage facile",
      description: "Partagez vos adresses avec QR code ou lien direct.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 py-20 min-h-[90vh] bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <h1 className="text-5xl md:text-7xl font-black mb-6">
         Système d'adressage numérique.
        </h1>
        <p className="text-xl md:text-2xl mb-10 text-gray-600">
          Créez, vérifiez et partagez vos adresses facilement.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/addresses/new">
            <Button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 flex items-center gap-2">
              <MapPin className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
              Créer mon adresse
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50"
      >
        <h2 className="text-4xl font-black text-center mb-12">
          Fonctionnalités clés
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="p-6 hover:shadow-xl transition-shadow duration-200"
            >
              <CardHeader>
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <CardTitle className="text-xl font-bold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how"
        className="py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 to-purple-50"
      >
        <h2 className="text-4xl font-black text-center mb-12">
          Comment ça marche
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200">
            <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Créer votre adresse</h3>
            <p className="text-gray-600">
              Remplissez votre localisation et détails pour générer votre
              adresse numérique.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Valider</h3>
            <p className="text-gray-600">
              Vérification rapide pour garantir que votre adresse est exacte et
              utilisable.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200">
            <Globe className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Partager partout</h3>
            <p className="text-gray-600">
              Partagez votre adresse via lien, QR code ou directement dans
              l’app.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-20 px-4 sm:px-6 bg-white">
        <h2 className="text-4xl font-black text-center mb-12">
          Cas d'utilisation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase, i) => (
            <Card
              key={i}
              className="p-6 hover:shadow-xl transition-shadow duration-200 text-center"
            >
              <useCase.icon className="w-10 h-10 text-blue-600 mb-4 mx-auto" />
              <CardTitle className="text-xl font-bold mb-2">
                {useCase.title}
              </CardTitle>
              <CardContent>
                <p className="text-gray-600">{useCase.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 px-4 sm:px-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white relative overflow-hidden"
      >
        <h2 className="text-4xl font-black text-center mb-12">
          Ce que disent nos utilisateurs
        </h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl mb-4">
            "{testimonials[currentTestimonial].text}"
          </p>
          <p className="font-semibold mb-2">
            {testimonials[currentTestimonial].author}
          </p>
          <div className="flex justify-center gap-1">
            {Array.from({
              length: testimonials[currentTestimonial].rating,
            }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-yellow-400" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white text-center relative overflow-hidden">
        <h2 className="text-4xl md:text-6xl font-black mb-6">
          Prêt à révolutionner votre adressage ?
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <Link href="/create-address" passHref legacyBehavior>
            <Button className="group bg-white text-blue-600 px-10 py-4 rounded-full shadow-2xl hover:scale-105 flex items-center gap-3 text-lg font-bold">
              <MapPin className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" />
              Créer mon adresse maintenant
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>

          <Button
            variant="outline"
            className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-full flex items-center gap-2 text-lg"
          >
            <Download className="w-5 h-5" /> Télécharger l'app
          </Button>
        </div>
      </section>

    </div>
  );
}
