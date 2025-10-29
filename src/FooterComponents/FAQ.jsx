import { useState } from "react";
import { Search, Send, Plus, ChevronDown, ChevronUp } from "lucide-react";
import PropTypes from "prop-types";
import { SuccessToast } from "../app/Toast/Success";

// Custom Accordion Component
const AccordionItem = ({ question, answer, category, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-700">
      <button
        className="flex justify-between items-center w-full py-4 px-2 text-left focus:outline-none"
        onClick={onClick}
      >
        <div className="text-left">
          <span className="text-purple-400 mr-2">[{category}]</span>
          <span className="text-white hover:text-purple-400">{question}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100 pb-4 px-2" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-gray-300">{answer}</p>
      </div>
    </div>
  );
};
AccordionItem.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Custom Select Component
const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  name,
  id,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");

  const handleSelect = (option) => {
    setSelectedValue(option.value);
    onChange && onChange(option.value);
    setIsOpen(false);
  };
  CustomSelect.propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      })
    ).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    name: PropTypes.string,
    id: PropTypes.string,
    required: PropTypes.bool,
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex justify-between items-center w-full px-4 py-2 bg-[#252525] border border-gray-700 rounded-md text-white"
        onClick={() => setIsOpen(!isOpen)}
        id={id}
      >
        <span className={selectedValue ? "text-white" : "text-gray-400"}>
          {selectedValue
            ? options.find((opt) => opt.value === selectedValue)?.label
            : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-[#252525] border border-gray-700 rounded-md shadow-lg">
          {options.map((option) => (
            <div
              key={option.value}
              className="px-4 py-2 cursor-pointer hover:bg-gray-700 text-white"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      <input
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
      />
    </div>
  );
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);

  // Initial FAQ data
  const [faqs, ] = useState([
    {
      id: "1",
      question: "What is an NFT?",
      answer:
        "NFT stands for Non-Fungible Token. It's a digital asset that represents ownership of a unique item or piece of content on the blockchain. Unlike cryptocurrencies such as Bitcoin, NFTs cannot be exchanged on a one-to-one basis as each one has distinct properties and values.",
      category: "NFT Basics",
    },
    {
      id: "2",
      question: "How do I create an account on DURCHEX?",
      answer:
        "To create an account on DURCHEX, click the 'Connect Wallet' button in the top right corner of the homepage. You can connect using MetaMask, WalletConnect, or other supported wallet providers. Once connected, your account is automatically created and you can start exploring the marketplace.",
      category: "Account",
    },
    {
      id: "3",
      question: "Which blockchains does DURCHEX support?",
      answer:
        "DURCHEX supports multiple blockchains including Ethereum, BNB Chain, Solana, Avalanche, Algorand, Aptos, SUI, Fantom (Layer 1), as well as Polygon, Base, zkSync, Arbitrum, and Optimism (Layer 2).",
      category: "Platform",
    },
    {
      id: "4",
      question: "How do I buy an NFT on DURCHEX?",
      answer:
        "To buy an NFT, browse the marketplace and select the NFT you want to purchase. Click the 'Buy Now' button or place a bid if it's an auction. Connect your wallet if you haven't already, confirm the transaction details, and approve the transaction in your wallet. Once the transaction is confirmed on the blockchain, the NFT will appear in your collection.",
      category: "Transactions",
    },
    {
      id: "5",
      question: "What payment methods are accepted?",
      answer:
        "DURCHEX accepts various payment methods including cryptocurrency tokens like USDT, USDC, and MATIC. We also support fiat payments through Moonpay, Transak, Ramp, Stripe, PayPal, and Mercuryo.",
      category: "Payments",
    },
    {
      id: "6",
      question: "How are gas fees handled?",
      answer:
        "Gas fees vary depending on the blockchain network you're using. DURCHEX displays the estimated gas fees before you confirm any transaction. On some networks, we offer gas-free transactions through our gas fee optimization technology.",
      category: "Transactions",
    },
  ]);

  // Handle form submission for new questions
  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newQuestion = {
      question: formData.get("question"),
      email: formData.get("email"),
      category: formData.get("category"),
    };

    // Here you would typically send this to your backend
    console.log("New question submitted:", newQuestion);

    // Reset form and hide it
    setShowForm(false);
    e.target.reset();

    // Show success message (in a real app)
    SuccessToast("Thank you for your question! Our team will review it shortly.");
  };

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle accordion
  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-300">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-400">
            Find answers to commonly asked questions about our marketplace,
            NFTs, and blockchain technology
          </p>
        </div>

        {/* Search and Ask Question */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search FAQs..."
              className="w-full pl-10 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white flex items-center justify-center transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> Ask a Question
          </button>
        </div>

        {/* Question submission form */}
        {showForm && (
          <div className="mb-10 bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden text-white">
            <form onSubmit={handleSubmitQuestion}>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Submit Your Question
                </h3>
                <p className="text-gray-400 mb-6">
                  Can&apos;t find what you&apos;re looking for? Submit your
                  question and we&apos;ll get back to you.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="question"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Your Question
                    </label>
                    <textarea
                      id="question"
                      name="question"
                      placeholder="Type your question here..."
                      className="w-full px-4 py-2 bg-[#252525] border border-gray-700 rounded-md text-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 bg-[#252525] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Category
                      </label>
                      <CustomSelect
                        id="category"
                        name="category"
                        placeholder="Select category"
                        value="general"
                        options={[
                          { value: "general", label: "General" },
                          { value: "nft-basics", label: "NFT Basics" },
                          { value: "account", label: "Account" },
                          { value: "platform", label: "Platform" },
                          { value: "transactions", label: "Transactions" },
                          { value: "payments", label: "Payments" },
                          { value: "technical", label: "Technical" },
                        ]}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-[#151515] flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white flex items-center transition-colors"
                >
                  <Send className="mr-2 h-4 w-4" /> Submit Question
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FAQ Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-8">
          {[
            "All",
            "NFT Basics",
            "Account",
            "Platform",
            "Transactions",
            "Payments",
          ].map((category) => (
            <button
              key={category}
              className={`px-3 py-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors ${
                searchQuery === "" && category === "All" ? "bg-gray-700" : ""
              }`}
              onClick={() => {
                if (category === "All") {
                  setSearchQuery("");
                } else {
                  setSearchQuery(category);
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        {filteredFaqs.length > 0 ? (
          <div className="w-full">
            {filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                question={faq.question}
                answer={faq.answer}
                category={faq.category}
                isOpen={openAccordion === faq.id}
                onClick={() => toggleAccordion(faq.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium text-white mb-2">
              No FAQs Found
            </h3>
            <p className="text-gray-400 mb-6">
              We couldn&apos;t find any FAQs matching your search criteria.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-400 mb-6">
            Our support team is here to help you with any questions you may
            have.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
              onClick={() =>
                (window.location.href = "mailto:support@durchex.com")
              }
            >
              Email Support
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white transition-colors"
              onClick={() =>
                window.open("https://discord.gg/3tkGsgTs", "_blank")
              }
            >
              Join Discord Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}