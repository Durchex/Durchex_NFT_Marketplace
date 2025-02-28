import { ChevronDown } from "react-feather";
import { useFilter } from "../Context/FilterContext";

function FilterSidebar() {
  const { filters, updateFilters } = useFilter();

  const handleStatusChange = (status) => {
    updateFilters({ status });
  };

  const handlePriceChange = (field, value) => {
    updateFilters({ [field]: value });
  };

  return (
    <div className="w-64 bgblack p-4 h-full">
      {/* Status Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Status</h3>
          <ChevronDown size={16} />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              checked={filters.status === "all"}
              onChange={() => handleStatusChange("all")}
              className="form-radio text-purple-500"
            />
            <span className="text-sm">All</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              checked={filters.status === "on-sale"}
              onChange={() => handleStatusChange("on-sale")}
              className="form-radio text-purple-500"
            />
            <span className="text-sm">On sale</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="status"
              checked={filters.status === "not-for-sale"}
              onChange={() => handleStatusChange("not-for-sale")}
              className="form-radio text-purple-500"
            />
            <span className="text-sm">Not for sale</span>
          </label>
        </div>
      </div>

      {/* Price Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Price</h3>
          <ChevronDown size={16} />
        </div>
        <div className="space-y-4">
          <select
            value={filters.currency}
            onChange={(e) => updateFilters({ currency: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ETH">ETH</option>
            <option value="WETH">WETH</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handlePriceChange("minPrice", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Traits Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Traits</h3>
          <ChevronDown size={16} />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              onChange={(e) => {
                const traits = e.target.checked
                  ? [...filters.traits, "background"]
                  : filters.traits.filter((t) => t !== "background");
                updateFilters({ traits });
              }}
              checked={filters.traits.includes("background")}
              className="form-checkbox text-purple-500"
            />
            <span className="text-sm">Background</span>
          </label>
          {/* Add more trait options as needed */}
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;
