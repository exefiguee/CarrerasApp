// /*import { useState } from 'react';
// import { paymentService } from '../services/paymentService';

// const PaymentModal = ({ betData, onClose, onPaymentComplete }) => {
//   const [loading, setLoading] = useState(false);
//   const [showSchedule, setShowSchedule] = useState(false);

//   const scheduleInfo = paymentService.getPaymentScheduleInfo();

//   const handleProceedToPayment = async () => {
//     try {
//       setLoading(true);
      
//       // Crear preferencia de pago en Mercado Pago
//       const preference = await paymentService.createPaymentPreference(betData);
      
//       // Redirigir a Mercado Pago
//       window.location.href = preference.init_point;
      
//     } catch (error) {
//       console.error('Error processing payment:', error);
//       alert('Error al procesar el pago. Intentá nuevamente.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="bg-primary text-white p-4">
//           <h2 className="text-xl font-bold">💳 Confirmar Apuesta</h2>
//         </div>

//         {/* Content */}
//         <div className="p-6 space-y-4">
//           {/* Resumen de apuesta */}
//           <div className="bg-gray-50 rounded-lg p-4 space-y-2">
//             <h3 className="font-bold text-secondary mb-3">📋 Resumen de tu Apuesta</h3>
            
//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Carrera:</span>
//                 <span className="font-medium">{betData.raceName}</span>
//               </div>
              
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Tipo:</span>
//                 <span className="font-medium">{betData.betType}</span>
//               </div>
              
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Caballos:</span>
//                 <div className="text-right">
//                   {betData.selections.map((horse, index) => (
//                     <div key={horse.number}>
//                       {index + 1}° → #{horse.number} {horse.name}
//                     </div>
//                   ))}
//                 </div>
//               </div>
              
//               <div className="pt-2 border-t border-gray-300">
//                 <div className="flex justify-between items-center">
//                   <span className="text-gray-600">Monto a pagar:</span>
//                   <span className="text-2xl font-bold text-primary">
//                     ARS {betData.amount.toLocaleString()}
//                   </span>
//                 </div>
//               </div>

//               <div className="flex justify-between items-center bg-green-50 p-2 rounded">
//                 <span className="text-gray-600">Ganancia potencial:</span>
//                 <span className="text-lg font-bold text-green-600">
//                   ARS {betData.potentialWin?.toLocaleString() || '0'}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Info de pagos */}
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <div className="flex items-start space-x-2">
//               <span className="text-2xl">ℹ️</span>
//               <div className="flex-1">
//                 <h4 className="font-bold text-blue-900 mb-2">
//                   Información de Pagos
//                 </h4>
//                 <p className="text-sm text-blue-800">
//                   Los premios de carreras ganadoras se pagan en horarios específicos.
//                 </p>
//                 <button
//                   onClick={() => setShowSchedule(!showSchedule)}
//                   className="text-blue-600 text-sm font-medium mt-2 underline"
//                 >
//                   {showSchedule ? 'Ocultar' : 'Ver'} horarios de pago
//                 </button>
//               </div>
//             </div>

//             {showSchedule && (
//               <div className="mt-3 pt-3 border-t border-blue-200">
//                 <div className="space-y-2 text-sm">
//                   {scheduleInfo.schedules.map((schedule, index) => (
//                     <div key={index} className="flex justify-between">
//                       <span className="font-medium">{schedule.day}:</span>
//                       <span className="text-blue-800">{schedule.hours}</span>
//                     </div>
//                   ))}
//                 </div>
//                 <p className="text-xs text-blue-700 mt-3">
//                   💰 Los premios se acreditan en 24-48hs hábiles después de la carrera.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Mercado Pago info */}
//           <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-4">
//             <div className="flex items-center space-x-3 mb-2">
//               <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
//                 MP
//               </div>
//               <div>
//                 <p className="font-bold text-secondary">Pago con Mercado Pago</p>
//                 <p className="text-xs text-gray-600">Seguro y confiable</p>
//               </div>
//             </div>
//             <p className="text-xs text-gray-600">
//               Serás redirigido a Mercado Pago para completar tu pago de forma segura.
//             </p>
//           </div>

//           {/* Botones */}
//           <div className="space-y-3">
//             <button
//               onClick={handleProceedToPayment}
//               disabled={loading}
//               className={`w-full font-bold py-4 rounded-lg transition-colors ${
//                 loading
//                   ? 'bg-gray-400 cursor-not-allowed'
//                   : 'bg-green-600 hover:bg-green-700 text-white'
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
//                   </svg>
//                   Procesando...
//                 </span>
//               ) : (
//                 '✅ Proceder al Pago'
//               )}
//             </button>

//             <button
//               onClick={onClose}
//               disabled={loading}
//               className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors"
//             >
//               Cancelar
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PaymentModal;