from setuptools import setup

setup(
    name='xblock-snap',
    version='0.1',
    description='XBlock for Snap Problems',
    py_modules=['snap_context'],
    install_requires=['XBlock'],
    entry_points={
        'xblock.v1': [
            'snap_context = snap_context:SnapContextBlock',
        ]
    }
)