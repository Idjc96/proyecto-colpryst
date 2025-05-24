import React, { useState } from 'react';
import Swal from 'sweetalert2';

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'text-blue-500 border-b-2 border-blue-500'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function TimeInput({ label, value, onChange }) {
  const handleTimeClick = async () => {
    const result = await Swal.fire({
      title: 'Seleccionar hora',
      html: `<div class="text-sm text-gray-600 mb-4">${label}</div>`,
      input: 'text',
      inputValue: value,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#6B7280',
      customClass: {
        input: 'text-center'
      },
      didOpen: () => {
        const input = Swal.getInput();
        window.flatpickr(input, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "h:i K", // Format for 12-hour time with AM/PM
          time_24hr: false,
          defaultDate: value,
          minuteIncrement: 1
        });
      }
    });

    if (result.isConfirmed && result.value) {
      onChange(result.value);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative" onClick={handleTimeClick}>
        <input
          type="text"
          value={value}
          readOnly
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-center"
        />
      </div>
    </div>
  );
}

function DaySchedule({ day, schedule, onUpdate }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-700">{day}</span>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={schedule.isWorkDay}
            onChange={(e) => onUpdate(day, 'isWorkDay', e.target.checked)}
            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-xs text-gray-600">Día laboral</span>
        </label>
      </div>

      {schedule.isWorkDay && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <TimeInput
              label="Entrada"
              value={schedule.entryTime}
              onChange={(value) => onUpdate(day, 'entryTime', value)}
            />
            <TimeInput
              label="Salida"
              value={schedule.exitTime}
              onChange={(value) => onUpdate(day, 'exitTime', value)}
            />
          </div>

          <div className="flex items-center mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={schedule.hasLunch}
                onChange={(e) => onUpdate(day, 'hasLunch', e.target.checked)}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-xs text-gray-600">Almuerzo</span>
            </label>
          </div>

          {schedule.hasLunch && (
            <div className="grid grid-cols-2 gap-2">
              <TimeInput
                label="Inicio almuerzo"
                value={schedule.lunchStart}
                onChange={(value) => onUpdate(day, 'lunchStart', value)}
              />
              <TimeInput
                label="Fin almuerzo"
                value={schedule.lunchEnd}
                onChange={(value) => onUpdate(day, 'lunchEnd', value)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState('schedules');
  const [settings, setSettings] = useState({
    toleranceMinutes: '15',
    notifications: {
      lateArrivals: true,
      absences: true
    },
    schedules: {
      Lunes: {
        isWorkDay: true,
        entryTime: '8:00 AM',
        exitTime: '5:00 PM',
        hasLunch: true,
        lunchStart: '1:00 PM',
        lunchEnd: '2:00 PM'
      },
      Martes: {
        isWorkDay: true,
        entryTime: '8:00 AM',
        exitTime: '5:00 PM',
        hasLunch: true,
        lunchStart: '1:00 PM',
        lunchEnd: '2:00 PM'
      },
      Miércoles: {
        isWorkDay: true,
        entryTime: '8:00 AM',
        exitTime: '5:00 PM',
        hasLunch: true,
        lunchStart: '1:00 PM',
        lunchEnd: '2:00 PM'
      },
      Jueves: {
        isWorkDay: true,
        entryTime: '8:00 AM',
        exitTime: '5:00 PM',
        hasLunch: true,
        lunchStart: '1:00 PM',
        lunchEnd: '2:00 PM'
      },
      Viernes: {
        isWorkDay: true,
        entryTime: '8:00 AM',
        exitTime: '4:00 PM',
        hasLunch: true,
        lunchStart: '1:00 PM',
        lunchEnd: '2:00 PM'
      },
      Sábado: {
        isWorkDay: true,
        entryTime: '8:00 AM',
        exitTime: '1:00 PM',
        hasLunch: false,
        lunchStart: '',
        lunchEnd: ''
      },
      Domingo: {
        isWorkDay: false,
        entryTime: '',
        exitTime: '',
        hasLunch: false,
        lunchStart: '',
        lunchEnd: ''
      }
    }
  });

  const handleUpdateSchedule = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [day]: {
          ...prev.schedules[day],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    Swal.fire({
      icon: 'success',
      title: '¡Cambios guardados!',
      text: 'Los horarios han sido actualizados exitosamente',
      confirmButtonColor: '#3B82F6',
      timer: 3000,
      timerProgressBar: true
    });
  };

  const handleApplyToAll = (sourceDay) => {
    const sourceSchedule = settings.schedules[sourceDay];
    const updatedSchedules = {};
    
    Object.keys(settings.schedules).forEach(day => {
      if (day !== sourceDay) {
        updatedSchedules[day] = { ...sourceSchedule };
      } else {
        updatedSchedules[day] = settings.schedules[day];
      }
    });

    setSettings(prev => ({
      ...prev,
      schedules: updatedSchedules
    }));

    Swal.fire({
      icon: 'success',
      title: 'Horario copiado',
      text: `El horario de ${sourceDay} ha sido aplicado a todos los días`,
      confirmButtonColor: '#3B82F6',
      timer: 2000,
      timerProgressBar: true
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <TabButton
            active={activeTab === 'schedules'}
            onClick={() => setActiveTab('schedules')}
          >
            Horarios
          </TabButton>
          <TabButton
            active={activeTab === 'permissions'}
            onClick={() => setActiveTab('permissions')}
          >
            Permisos
          </TabButton>
          <TabButton
            active={activeTab === 'lateArrivals'}
            onClick={() => setActiveTab('lateArrivals')}
          >
            Llegadas Tarde
          </TabButton>
          <TabButton
            active={activeTab === 'earlyDepartures'}
            onClick={() => setActiveTab('earlyDepartures')}
          >
            Salidas Temprano
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(settings.schedules).map(([day, schedule]) => (
                <DaySchedule
                  key={day}
                  day={day}
                  schedule={schedule}
                  onUpdate={handleUpdateSchedule}
                />
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleApplyToAll('Lunes')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Aplicar Lunes a todos
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="text-center text-gray-500 py-8">
            Configuración de permisos (En desarrollo)
          </div>
        )}

        {activeTab === 'lateArrivals' && (
          <div className="text-center text-gray-500 py-8">
            Configuración de llegadas tarde (En desarrollo)
          </div>
        )}

        {activeTab === 'earlyDepartures' && (
          <div className="text-center text-gray-500 py-8">
            Configuración de salidas temprano (En desarrollo)
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;