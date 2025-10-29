
import { createContext, useContext, useState } from "react"

const FilterContext = createContext()

export function FilterProvider({ children }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    minPrice: "",
    maxPrice: "",
    currency: "ETH",
    traits: [],
  })

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen)
  }

  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters })
  }

  return (
    <FilterContext.Provider value={{ isFilterOpen, toggleFilter, filters, updateFilters }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider")
  }
  return context
}
