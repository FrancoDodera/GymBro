import React from 'react';

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    itemsShowing,
    onPageChange,
    onItemsPerPageChange
}) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 7;

        if (totalPages <= maxPagesToShow) {
            // Mostrar todas las páginas si son pocas
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Lógica para mostrar: [1] ... [current-1] [current] [current+1] ... [last]
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const handlePageClick = (page) => {
        if (page !== '...' && page !== currentPage) {
            onPageChange(page);
        }
    };

    return (
        <div className="bg-dark-800/50 backdrop-blur-sm rounded-xl p-4 border border-dark-700">
            {/* Top Row: Info and Items Per Page */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                {/* Total Count */}
                <div className="text-sm text-gray-300">
                    <span className="font-semibold text-primary-400">{totalItems}</span>
                    <span className="text-gray-400"> ejercicios en total</span>
                    {itemsShowing > 0 && (
                        <>
                            <span className="text-gray-600 mx-2">•</span>
                            <span className="text-gray-400">Mostrando </span>
                            <span className="font-semibold text-accent-400">
                                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, itemsShowing)}
                            </span>
                            <span className="text-gray-400"> de {itemsShowing}</span>
                        </>
                    )}
                </div>

                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Mostrar:</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="input py-1.5 px-3 text-sm min-w-[100px]"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={999999}>Todos</option>
                    </select>
                </div>
            </div>

            {/* Bottom Row: Page Navigation */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Page Info */}
                    <div className="text-sm text-gray-400">
                        Página <span className="font-semibold text-white">{currentPage}</span> de <span className="font-semibold">{totalPages}</span>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-1">
                        {/* First Page */}
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-dark-700 text-gray-300"
                            title="Primera página"
                        >
                            ««
                        </button>

                        {/* Previous Page */}
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-dark-700 text-gray-300"
                            title="Página anterior"
                        >
                            ‹
                        </button>

                        {/* Page Numbers */}
                        <div className="hidden sm:flex items-center gap-1 mx-2">
                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-2 text-gray-600">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => handlePageClick(page)}
                                        className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page
                                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30'
                                            : 'hover:bg-dark-700 text-gray-300'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}
                        </div>

                        {/* Next Page */}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-dark-700 text-gray-300"
                            title="Página siguiente"
                        >
                            ›
                        </button>

                        {/* Last Page */}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-dark-700 text-gray-300"
                            title="Última página"
                        >
                            »»
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pagination;
