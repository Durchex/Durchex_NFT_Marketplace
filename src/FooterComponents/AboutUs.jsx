import { FaCompass, FaUsers, FaCode, FaChevronRight } from "react-icons/fa";
import Header from "../components/Header";


function About() {
  return (
    <div className="bg-[#252329]">
        <Header/>
      <div className="container mx-auto px-4 max-w-6xl ">
        <div className="flex flex-col gap-16 py-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About Us
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Empowering creators and collectors in the digital ownership
              revolution
            </p>
          </div>

          {/* Mission Section */}
          <section className="py-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center  px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-600">
                  Our Mission
                </div>
                <h2 className="text-3xl font-bold text-white md:text-left text-center">
                  Redefining Digital Ownership
                </h2>
                <p className="text-lg text-gray-300 md:text-left text-justify">
                  We&apos;re a decentralized NFT marketplace built to empower
                  creators and collectors with seamless trading and minting
                  experiences.
                </p>
                <button className="mt-2 bg-indigo-600 text-white px-5 py-2.5 rounded-md font-medium flex items-center hover:bg-indigo-700 transition-colors">
                  Explore Marketplace{" "}
                  <FaChevronRight className="ml-2 h-3 w-3" />
                </button>
              </div>
              <div className="relative h-[300px] rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1620121692029-d088224ddc74?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80"
                  alt="Digital art marketplace"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* Values Cards */}
          <section className="py-10">
            <h2 className="text-3xl font-bold text-center mb-10 text-white">
              What Drives Us
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow hover:-translate-y-1 duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <FaCompass className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Innovation</h3>
                <p className="text-gray-600 mt-2">
                  Pushing the boundaries of what&apos;s possible in the NFT
                  space through cutting-edge technology.
                </p>
              </div>
              <div className="bg-gray-200  p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow hover:-translate-y-1 duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <FaUsers className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Community</h3>
                <p className="text-gray-600 mt-2">
                  Building a vibrant ecosystem where creators and collectors can
                  connect and thrive.
                </p>
              </div>
              <div className="bg-gray-200  p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow hover:-translate-y-1 duration-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <FaCode className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold">Technology</h3>
                <p className="text-gray-600 mt-2">
                  Leveraging blockchain technology to ensure security,
                  transparency, and true ownership.
                </p>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="relative h-[300px] rounded-lg overflow-hidden order-last md:order-first">
                <img
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80"
                  alt="Our team"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-600">
                  Our Team
                </div>
                <h2 className="text-3xl font-bold text-white  md:text-left text-center">
                  Passionate About Blockchain
                </h2>
                <p className="text-lg text-gray-300 md:text-left text-justify">
                  Our team is passionate about blockchain technology and digital
                  ownership—learn more about our journey.
                </p>
                <button className="mt-2 border border-indigo-600 text-indigo-600 px-5 py-2.5 rounded-md font-medium flex items-center hover:bg-indigo-50 transition-colors">
                  Meet The Team <FaChevronRight className="ml-2 h-3 w-3" />
                </button>
              </div>
            </div>
          </section>

          {/* Technology Section */}
          <section className="py-10 bg-gray-200 rounded-xl p-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold">Our Technology</h2>
              <p className="text-lg text-gray-600">
                Discover how we use Pinata for metadata storage and smart
                contracts for secure NFT transactions.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button className="border border-indigo-600 text-indigo-600 px-5 py-2.5 rounded-md font-medium hover:bg-indigo-50 transition-colors">
                  Technical Documentation
                </button>
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-md font-medium hover:bg-indigo-700 transition-colors">
                  Start Creating
                </button>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-10">
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-white">
                Ready to Join the Revolution?
              </h2>
              <p className="text-lg text-gray-300">
                Start your journey in the world of digital collectibles today.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium text-lg hover:bg-indigo-700 transition-colors">
                  Connect Wallet
                </button>
                <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md font-medium text-lg hover:bg-indigo-50 transition-colors">
                  Browse Marketplace
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default About;