"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, SlidersHorizontal } from "lucide-react"

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export interface SearchFilters {
  query: string
  category: string
  minPrice?: string
  maxPrice?: string
  rating?: number
  deliveryTime?: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

const defaultFilters: SearchFilters = {
  query: "",
  category: "all",
  minPrice: "",
  maxPrice: "",
  rating: 0,
  deliveryTime: "any",
  sortBy: "createdAt",
  sortOrder: "desc"
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "design", label: "Design" },
  { value: "writing", label: "Writing & Translation" },
  { value: "marketing", label: "Digital Marketing" },
  { value: "video", label: "Video & Animation" },
  { value: "music", label: "Music & Audio" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
]

const deliveryTimeOptions = [
  { value: "any", label: "Any Time" },
  { value: "1", label: "Up to 1 day" },
  { value: "3", label: "Up to 3 days" },
  { value: "7", label: "Up to 1 week" },
  { value: "14", label: "Up to 2 weeks" },
  { value: "30", label: "Up to 1 month" },
]

const sortOptions = [
  { value: "createdAt", label: "Date" },
  { value: "price", label: "Price" },
  { value: "rating", label: "Rating" },
]

export function AdvancedSearch({ onSearch, initialFilters }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || defaultFilters)
  const [isOpen, setIsOpen] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleRatingChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, rating: value[0] }))
  }

  const handleSortOrderToggle = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
    }))
  }

  const handleSearch = () => {
    onSearch(filters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
  }

  const handleSimpleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSimpleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="query"
            placeholder="Search services..."
            className="pl-9"
            value={filters.query}
            onChange={handleInputChange}
          />
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" type="button">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Advanced Search</SheetTitle>
              <SheetDescription>
                Refine your search with additional filters
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="price">
                  <AccordionTrigger>Price Range</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minPrice">Min Price ($)</Label>
                        <Input
                          id="minPrice"
                          name="minPrice"
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxPrice">Max Price ($)</Label>
                        <Input
                          id="maxPrice"
                          name="maxPrice"
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="rating">
                  <AccordionTrigger>Minimum Rating</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Rating: {filters.rating}</Label>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <= (filters.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <Slider
                        defaultValue={[filters.rating || 0]}
                        max={5}
                        step={1}
                        onValueChange={handleRatingChange}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="delivery">
                  <AccordionTrigger>Delivery Time</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryTime">Maximum Delivery Time</Label>
                      <Select
                        value={filters.deliveryTime}
                        onValueChange={(value) => handleSelectChange("deliveryTime", value)}
                      >
                        <SelectTrigger id="deliveryTime">
                          <SelectValue placeholder="Select delivery time" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryTimeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="sort">
                  <AccordionTrigger>Sort By</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sortBy">Sort By</Label>
                        <Select
                          value={filters.sortBy}
                          onValueChange={(value) => handleSelectChange("sortBy", value)}
                        >
                          <SelectTrigger id="sortBy">
                            <SelectValue placeholder="Select sort option" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sortOrder"
                          checked={filters.sortOrder === "asc"}
                          onCheckedChange={handleSortOrderToggle}
                        />
                        <label
                          htmlFor="sortOrder"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Sort Ascending (low to high)
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <SheetFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleReset} type="button">
                Reset Filters
              </Button>
              <Button onClick={handleSearch} type="button">
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        <Button type="submit">
          Search
        </Button>
      </form>
    </div>
  )
}
